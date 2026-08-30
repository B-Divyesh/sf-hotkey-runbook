use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use rand::RngCore;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, HashMap},
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    process::Command,
    time::Instant,
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use thiserror::Error;
use uuid::Uuid;
use walkdir::WalkDir;

type HmacSha256 = Hmac<Sha256>;

const MAX_FILE_BYTES: u64 = 65_536;
const MAX_OUTPUT_BYTES: usize = 65_536;
const MAX_HISTORY: usize = 100;

#[derive(Debug, Error)]
enum AppError {
    #[error("{0}")]
    Message(String),
    #[error("Could not read local data: {0}")]
    Io(#[from] std::io::Error),
    #[error("Invalid YAML: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("Could not serialize local data: {0}")]
    Json(#[from] serde_json::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Parameter {
    name: String,
    label: String,
    #[serde(rename = "type")]
    kind: ParameterType,
    #[serde(default)]
    required: bool,
    description: Option<String>,
    default: Option<Value>,
    choices: Option<Vec<String>>,
    pattern: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum ParameterType {
    Text,
    Integer,
    Choice,
    Boolean,
    Path,
    Secret,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Step {
    program: String,
    #[serde(default)]
    args: Vec<String>,
    cwd: Option<String>,
    #[serde(default)]
    env: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunbookFile {
    version: u8,
    id: String,
    name: String,
    description: String,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default = "default_risk")]
    risk: String,
    rollback: String,
    #[serde(default)]
    parameters: Vec<Parameter>,
    steps: Vec<Step>,
    #[serde(default)]
    redact_patterns: Vec<String>,
}

fn default_risk() -> String {
    "medium".into()
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunbookSummary {
    id: String,
    name: String,
    description: String,
    tags: Vec<String>,
    risk: String,
    rollback: String,
    parameters: Vec<Parameter>,
    step_count: usize,
    source: String,
    trusted: bool,
}

#[derive(Debug, Clone)]
struct LoadedRunbook {
    key: String,
    source: PathBuf,
    runbook: RunbookFile,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TrustRecord {
    path: String,
    digest: String,
    signed_at: DateTime<Utc>,
    signature: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TrustedDirectory {
    path: String,
    digest: String,
    signed_at: DateTime<Utc>,
    valid: bool,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct AppState {
    runbooks: Vec<RunbookSummary>,
    directories: Vec<TrustedDirectory>,
    errors: Vec<String>,
    demo_mode: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DirectoryInspection {
    path: String,
    digest: String,
    files: Vec<String>,
    runbooks: Vec<RunbookSummary>,
    warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PreparedStep {
    program: String,
    args: Vec<String>,
    cwd: Option<String>,
    env: BTreeMap<String, String>,
    display: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PreparedRun {
    runbook_id: String,
    name: String,
    risk: String,
    rollback: String,
    steps: Vec<PreparedStep>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunResult {
    id: String,
    runbook_id: String,
    name: String,
    started_at: DateTime<Utc>,
    duration_ms: u128,
    status: String,
    exit_code: Option<i32>,
    output: String,
    rollback: String,
}

fn app_data_dir() -> AppResult<PathBuf> {
    let base = dirs::data_local_dir().ok_or_else(|| {
        AppError::Message("This platform does not provide a local app-data directory.".into())
    })?;
    let path = base.join("in.sociobot.hotkey-runbook");
    fs::create_dir_all(&path)?;
    Ok(path)
}

fn read_json<T: for<'de> Deserialize<'de> + Default>(path: &Path) -> AppResult<T> {
    if !path.exists() {
        return Ok(T::default());
    }
    Ok(serde_json::from_slice(&fs::read(path)?)?)
}

fn write_json<T: Serialize>(path: &Path, value: &T) -> AppResult<()> {
    let temporary = path.with_extension("tmp");
    let bytes = serde_json::to_vec_pretty(value)?;
    fs::write(&temporary, bytes)?;
    fs::rename(temporary, path)?;
    Ok(())
}

fn signing_key() -> AppResult<Vec<u8>> {
    let path = app_data_dir()?.join("device-signing-key");
    if path.exists() {
        return Ok(fs::read(path)?);
    }
    let mut key = vec![0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .mode(0o600)
            .open(&path)?;
        file.write_all(&key)?;
    }
    #[cfg(not(unix))]
    fs::write(&path, &key)?;
    Ok(key)
}

fn sign(path: &str, digest: &str) -> AppResult<String> {
    let mut mac = HmacSha256::new_from_slice(&signing_key()?)
        .map_err(|_| AppError::Message("Could not initialize local signature.".into()))?;
    mac.update(path.as_bytes());
    mac.update(&[0]);
    mac.update(digest.as_bytes());
    Ok(hex::encode(mac.finalize().into_bytes()))
}

fn verify_record(record: &TrustRecord) -> AppResult<bool> {
    Ok(sign(&record.path, &record.digest)? == record.signature)
}

fn trust_records() -> AppResult<Vec<TrustRecord>> {
    read_json(&app_data_dir()?.join("trusted-directories.json"))
}
fn save_trust_records(records: &[TrustRecord]) -> AppResult<()> {
    write_json(&app_data_dir()?.join("trusted-directories.json"), &records)
}

fn assert_owned(path: &Path) -> AppResult<Vec<String>> {
    let metadata = fs::symlink_metadata(path)?;
    if !metadata.is_dir() {
        return Err(AppError::Message("Choose a folder, not a file.".into()));
    }
    if metadata.file_type().is_symlink() {
        return Err(AppError::Message(
            "Symlinked runbook folders are not accepted.".into(),
        ));
    }
    let warnings = Vec::new();
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        if metadata.uid() != unsafe { libc::geteuid() } {
            return Err(AppError::Message(
                "The selected folder is not owned by your current user.".into(),
            ));
        }
        if metadata.mode() & 0o002 != 0 {
            return Err(AppError::Message("The selected folder is writable by other users. Restrict its permissions before trusting it.".into()));
        }
    }
    Ok(warnings)
}

/// Check the path selected by the person before resolving it. Checking only
/// after canonicalisation would turn a symlink into its target and silently
/// accept a folder the person did not select.
fn assert_not_symlinked_root(path: &Path) -> AppResult<()> {
    let metadata = fs::symlink_metadata(path).map_err(|_| {
        AppError::Message("That folder no longer exists or is not readable.".into())
    })?;
    if metadata.file_type().is_symlink() {
        return Err(AppError::Message(
            "Symlinked runbook folders are not accepted.".into(),
        ));
    }
    Ok(())
}

fn yaml_files(path: &Path) -> AppResult<Vec<PathBuf>> {
    let mut files = Vec::new();
    for entry in WalkDir::new(path).max_depth(3).follow_links(false) {
        let entry = entry
            .map_err(|error| AppError::Message(format!("Could not inspect the folder: {error}")))?;
        if entry.file_type().is_symlink() {
            return Err(AppError::Message(format!(
                "Symlinks are not accepted: {}",
                entry.path().display()
            )));
        }
        if entry.file_type().is_file()
            && matches!(
                entry.path().extension().and_then(|v| v.to_str()),
                Some("yaml" | "yml")
            )
        {
            if entry
                .metadata()
                .map_err(|e| AppError::Message(e.to_string()))?
                .len()
                > MAX_FILE_BYTES
            {
                return Err(AppError::Message(format!(
                    "{} is larger than 64 KB.",
                    entry.path().display()
                )));
            }
            files.push(entry.path().to_path_buf());
        }
    }
    files.sort();
    if files.is_empty() {
        return Err(AppError::Message(
            "No .yaml or .yml runbooks were found within three folder levels.".into(),
        ));
    }
    if files.len() > 100 {
        return Err(AppError::Message(
            "A trusted folder may contain at most 100 YAML files.".into(),
        ));
    }
    Ok(files)
}

fn directory_digest(root: &Path, files: &[PathBuf]) -> AppResult<String> {
    let mut hasher = Sha256::new();
    for file in files {
        let relative = file
            .strip_prefix(root)
            .map_err(|_| AppError::Message("A runbook escaped its selected folder.".into()))?;
        hasher.update(relative.to_string_lossy().as_bytes());
        hasher.update([0]);
        hasher.update(fs::read(file)?);
        hasher.update([0]);
    }
    Ok(hex::encode(hasher.finalize()))
}

fn validate_runbook(runbook: &RunbookFile, source: &Path) -> AppResult<()> {
    if runbook.version != 1 {
        return Err(AppError::Message(format!(
            "{} uses unsupported version {}.",
            source.display(),
            runbook.version
        )));
    }
    let id_re = Regex::new(r"^[a-z0-9][a-z0-9-]{1,62}$").unwrap();
    let name_re = Regex::new(r"^[A-Za-z][A-Za-z0-9_]{0,31}$").unwrap();
    if !id_re.is_match(&runbook.id) {
        return Err(AppError::Message(format!(
            "{} has an invalid id.",
            source.display()
        )));
    }
    if runbook.name.trim().is_empty()
        || runbook.description.trim().is_empty()
        || runbook.rollback.trim().is_empty()
    {
        return Err(AppError::Message(format!(
            "{} needs a name, description, and rollback note.",
            source.display()
        )));
    }
    if !matches!(runbook.risk.as_str(), "low" | "medium" | "high") {
        return Err(AppError::Message(format!(
            "{} risk must be low, medium, or high.",
            source.display()
        )));
    }
    if runbook.steps.is_empty() || runbook.steps.len() > 20 {
        return Err(AppError::Message(format!(
            "{} needs 1–20 steps.",
            source.display()
        )));
    }
    let mut names = std::collections::HashSet::new();
    for parameter in &runbook.parameters {
        if !name_re.is_match(&parameter.name) || !names.insert(parameter.name.clone()) {
            return Err(AppError::Message(format!(
                "{} has an invalid or duplicate parameter name.",
                source.display()
            )));
        }
        if parameter.kind == ParameterType::Choice
            && parameter
                .choices
                .as_ref()
                .is_none_or(|values| values.is_empty())
        {
            return Err(AppError::Message(format!(
                "Choice parameter {} needs choices.",
                parameter.name
            )));
        }
        if let Some(pattern) = &parameter.pattern {
            Regex::new(pattern).map_err(|error| {
                AppError::Message(format!("Invalid pattern for {}: {error}", parameter.name))
            })?;
        }
    }
    let token_re = Regex::new(r"\{\{([A-Za-z][A-Za-z0-9_]*)\}\}").unwrap();
    for step in &runbook.steps {
        if step.program.trim().is_empty() || step.program.contains("{{") {
            return Err(AppError::Message(format!(
                "{} has an invalid program. Programs cannot contain parameters.",
                source.display()
            )));
        }
        for value in step
            .args
            .iter()
            .chain(step.env.values())
            .chain(step.cwd.iter())
        {
            for captures in token_re.captures_iter(value) {
                if !names.contains(&captures[1]) {
                    return Err(AppError::Message(format!(
                        "{} references unknown parameter {}.",
                        source.display(),
                        &captures[1]
                    )));
                }
            }
            let without = token_re.replace_all(value, "");
            if without.contains("{{") || without.contains("}}") {
                return Err(AppError::Message(format!(
                    "{} contains malformed parameter syntax.",
                    source.display()
                )));
            }
        }
    }
    for pattern in &runbook.redact_patterns {
        Regex::new(pattern)
            .map_err(|error| AppError::Message(format!("Invalid redaction pattern: {error}")))?;
    }
    Ok(())
}

fn load_files(root: &Path, files: &[PathBuf]) -> AppResult<Vec<LoadedRunbook>> {
    let mut loaded = Vec::new();
    for source in files {
        let runbook: RunbookFile = serde_yaml::from_slice(&fs::read(source)?)?;
        validate_runbook(&runbook, source)?;
        let mut hasher = Sha256::new();
        hasher.update(root.to_string_lossy().as_bytes());
        hasher.update([0]);
        hasher.update(runbook.id.as_bytes());
        let key = hex::encode(hasher.finalize())[..24].to_string();
        loaded.push(LoadedRunbook {
            key,
            source: source.clone(),
            runbook,
        });
    }
    Ok(loaded)
}

fn summary(item: &LoadedRunbook) -> RunbookSummary {
    RunbookSummary {
        id: item.key.clone(),
        name: item.runbook.name.clone(),
        description: item.runbook.description.clone(),
        tags: item.runbook.tags.clone(),
        risk: item.runbook.risk.clone(),
        rollback: item.runbook.rollback.clone(),
        parameters: item.runbook.parameters.clone(),
        step_count: item.runbook.steps.len(),
        source: item.source.display().to_string(),
        trusted: true,
    }
}

fn inspect_path(path: &str) -> AppResult<(DirectoryInspection, Vec<LoadedRunbook>)> {
    assert_not_symlinked_root(Path::new(path))?;
    let canonical = fs::canonicalize(path).map_err(|_| {
        AppError::Message("That folder no longer exists or is not readable.".into())
    })?;
    #[allow(unused_mut)]
    let mut warnings = assert_owned(&canonical)?;
    #[cfg(windows)]
    warnings.push("Windows does not expose a portable owner check here; your explicit review and device signature establish trust.".into());
    let files = yaml_files(&canonical)?;
    let digest = directory_digest(&canonical, &files)?;
    let loaded = load_files(&canonical, &files)?;
    let inspection = DirectoryInspection {
        path: canonical.display().to_string(),
        digest,
        files: files.iter().map(|p| p.display().to_string()).collect(),
        runbooks: loaded.iter().map(summary).collect(),
        warnings,
    };
    Ok((inspection, loaded))
}

fn verified_runbooks() -> AppResult<(Vec<LoadedRunbook>, Vec<TrustedDirectory>, Vec<String>)> {
    let mut loaded = Vec::new();
    let mut directories = Vec::new();
    let mut errors = Vec::new();
    for record in trust_records()? {
        let mut valid = false;
        let mut error = None;
        match verify_record(&record) {
            Ok(false) => error = Some("Its device signature is invalid. Remove and add the folder again.".into()),
            Err(e) => error = Some(e.to_string()),
            Ok(true) => match inspect_path(&record.path) {
                Ok((inspection, books)) if inspection.digest == record.digest => { valid = true; loaded.extend(books); }
                Ok(_) => error = Some("Contents changed after review. Remove and add the folder again to sign the new digest.".into()),
                Err(e) => error = Some(e.to_string()),
            }
        }
        if let Some(message) = &error {
            errors.push(format!("{}: {}", record.path, message));
        }
        directories.push(TrustedDirectory {
            path: record.path,
            digest: record.digest,
            signed_at: record.signed_at,
            valid,
            error,
        });
    }
    Ok((loaded, directories, errors))
}

fn current_state() -> AppResult<AppState> {
    let (mut loaded, directories, errors) = verified_runbooks()?;
    loaded.sort_by_key(|item| item.runbook.name.to_lowercase());
    let demo_mode = directories.iter().any(|directory| {
        directory.path
            == sample_project_dir()
                .map(|path| path.display().to_string())
                .unwrap_or_default()
    });
    Ok(AppState {
        runbooks: loaded.iter().map(summary).collect(),
        directories,
        errors,
        demo_mode,
    })
}

#[tauri::command]
fn get_state() -> AppResult<AppState> {
    current_state()
}

#[tauri::command]
fn inspect_directory(path: String) -> AppResult<DirectoryInspection> {
    Ok(inspect_path(&path)?.0)
}

#[tauri::command]
fn trust_directory(path: String, digest: String, acknowledged: bool) -> AppResult<AppState> {
    if !acknowledged {
        return Err(AppError::Message(
            "Confirm that you own or reviewed the folder before signing it.".into(),
        ));
    }
    let (inspection, _) = inspect_path(&path)?;
    if inspection.digest != digest {
        return Err(AppError::Message(
            "The folder changed during review. Inspect it again.".into(),
        ));
    }
    let mut records = trust_records()?;
    records.retain(|record| record.path != inspection.path);
    records.push(TrustRecord {
        path: inspection.path.clone(),
        digest: digest.clone(),
        signed_at: Utc::now(),
        signature: sign(&inspection.path, &digest)?,
    });
    save_trust_records(&records)?;
    current_state()
}

#[tauri::command]
fn remove_directory(path: String) -> AppResult<AppState> {
    let mut records = trust_records()?;
    records.retain(|record| record.path != path);
    save_trust_records(&records)?;
    current_state()
}

const SAMPLE_RUNBOOK: &str = r#"version: 1
id: inspect-sample-deployment
name: Inspect sample deployment
description: Checks a bundled sample target without changing your computer.
risk: low
tags: [sample, review]
parameters:
  - name: environment
    label: Sample environment
    type: choice
    required: true
    choices: [staging, production]
    default: staging
  - name: access_token
    label: Sample access token
    type: secret
    required: true
    default: sample-token
steps:
  - program: printf
    args: ["Checking %s deployment\\n", "{{environment}}"]
    env:
      HOTKEY_SAMPLE_TOKEN: "{{access_token}}"
rollback: This sample only prints a status line. No rollback is needed.
"#;

fn sample_project_dir() -> AppResult<PathBuf> {
    Ok(app_data_dir()?.join("demo-sample-project"))
}

fn is_sample_runbook(item: &LoadedRunbook) -> bool {
    item.source
        .parent()
        .is_some_and(|parent| sample_project_dir().is_ok_and(|sample| parent == sample))
}

#[tauri::command]
fn load_sample_project() -> AppResult<AppState> {
    let directory = sample_project_dir()?;
    fs::create_dir_all(&directory)?;
    fs::write(
        directory.join("inspect-sample-deployment.yaml"),
        SAMPLE_RUNBOOK,
    )?;
    let (inspection, _) = inspect_path(&directory.display().to_string())?;
    let mut records = trust_records()?;
    records.retain(|record| record.path != inspection.path);
    records.push(TrustRecord {
        path: inspection.path.clone(),
        digest: inspection.digest.clone(),
        signed_at: Utc::now(),
        signature: sign(&inspection.path, &inspection.digest)?,
    });
    save_trust_records(&records)?;
    current_state()
}

#[tauri::command]
fn reset_sample_project() -> AppResult<AppState> {
    let directory = sample_project_dir()?;
    let path = directory.display().to_string();
    let mut records = trust_records()?;
    records.retain(|record| record.path != path);
    save_trust_records(&records)?;
    if directory.exists() {
        fs::remove_dir_all(&directory)?;
    }
    let demo_history = app_data_dir()?.join("demo-history.json");
    if demo_history.exists() {
        fs::remove_file(demo_history)?;
    }
    current_state()
}

#[tauri::command]
fn reset_demo_project() -> AppResult<AppState> {
    reset_sample_project()?;
    load_sample_project()
}

fn value_string(parameter: &Parameter, values: &HashMap<String, Value>) -> AppResult<String> {
    let raw = values
        .get(&parameter.name)
        .cloned()
        .or_else(|| parameter.default.clone());
    if raw.as_ref().is_none_or(Value::is_null) || raw.as_ref().and_then(Value::as_str) == Some("") {
        if parameter.required {
            return Err(AppError::Message(format!(
                "{} is required.",
                parameter.label
            )));
        }
        return Ok(String::new());
    }
    let string = match (&parameter.kind, raw.unwrap()) {
        (ParameterType::Boolean, Value::Bool(value)) => value.to_string(),
        (ParameterType::Boolean, Value::String(value))
            if matches!(value.as_str(), "true" | "false") =>
        {
            value
        }
        (ParameterType::Integer, Value::Number(value)) if value.is_i64() || value.is_u64() => {
            value.to_string()
        }
        (_, Value::String(value)) => value,
        (_, value) => value.to_string(),
    };
    if string.contains('\0') {
        return Err(AppError::Message(format!(
            "{} contains a null character.",
            parameter.label
        )));
    }
    if parameter.kind == ParameterType::Integer
        && !Regex::new(r"^-?\d+$").unwrap().is_match(&string)
    {
        return Err(AppError::Message(format!(
            "{} must be a whole number.",
            parameter.label
        )));
    }
    if parameter.kind == ParameterType::Choice
        && !parameter
            .choices
            .as_ref()
            .is_some_and(|choices| choices.contains(&string))
    {
        return Err(AppError::Message(format!(
            "Choose an allowed value for {}.",
            parameter.label
        )));
    }
    if let Some(pattern) = &parameter.pattern {
        if !Regex::new(pattern).unwrap().is_match(&string) {
            return Err(AppError::Message(format!(
                "{} does not match its required format.",
                parameter.label
            )));
        }
    }
    Ok(string)
}

fn resolve_values(
    runbook: &RunbookFile,
    values: &HashMap<String, Value>,
) -> AppResult<HashMap<String, String>> {
    runbook
        .parameters
        .iter()
        .map(|parameter| Ok((parameter.name.clone(), value_string(parameter, values)?)))
        .collect()
}

fn substitute(template: &str, values: &HashMap<String, String>) -> AppResult<String> {
    let re = Regex::new(r"\{\{([A-Za-z][A-Za-z0-9_]*)\}\}").unwrap();
    let mut result = String::new();
    let mut previous = 0;
    for captures in re.captures_iter(template) {
        let matched = captures.get(0).unwrap();
        result.push_str(&template[previous..matched.start()]);
        result.push_str(
            values
                .get(&captures[1])
                .ok_or_else(|| AppError::Message(format!("Missing parameter {}.", &captures[1])))?,
        );
        previous = matched.end();
    }
    result.push_str(&template[previous..]);
    Ok(result)
}

fn locate(key: &str) -> AppResult<LoadedRunbook> {
    let (books, _, _) = verified_runbooks()?;
    books
        .into_iter()
        .find(|book| book.key == key)
        .ok_or_else(|| {
            AppError::Message(
                "That runbook is no longer trusted. Refresh its folder and try again.".into(),
            )
        })
}

fn prepare_loaded(
    item: &LoadedRunbook,
    values: &HashMap<String, Value>,
) -> AppResult<(PreparedRun, HashMap<String, String>)> {
    let resolved = resolve_values(&item.runbook, values)?;
    let mut steps = Vec::new();
    for step in &item.runbook.steps {
        let args: Vec<String> = step
            .args
            .iter()
            .map(|arg| substitute(arg, &resolved))
            .collect::<AppResult<_>>()?;
        let cwd = step
            .cwd
            .as_ref()
            .map(|value| substitute(value, &resolved))
            .transpose()?;
        let env: BTreeMap<String, String> = step
            .env
            .iter()
            .map(|(key, value)| Ok((key.clone(), substitute(value, &resolved)?)))
            .collect::<AppResult<_>>()?;
        let display = std::iter::once(&step.program)
            .chain(args.iter())
            .map(|part| {
                if part
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || "-._/:=@".contains(c))
                {
                    part.clone()
                } else {
                    format!("{:?}", part)
                }
            })
            .collect::<Vec<_>>()
            .join(" ");
        steps.push(PreparedStep {
            program: step.program.clone(),
            args,
            cwd,
            env,
            display,
        });
    }
    Ok((
        PreparedRun {
            runbook_id: item.key.clone(),
            name: item.runbook.name.clone(),
            risk: item.runbook.risk.clone(),
            rollback: item.runbook.rollback.clone(),
            steps,
        },
        resolved,
    ))
}

fn mask_plan_secrets(
    plan: &mut PreparedRun,
    runbook: &RunbookFile,
    resolved: &HashMap<String, String>,
) {
    for parameter in &runbook.parameters {
        if parameter.kind != ParameterType::Secret {
            continue;
        }
        if let Some(secret) = resolved.get(&parameter.name) {
            if secret.is_empty() {
                continue;
            }
            for step in &mut plan.steps {
                step.args
                    .iter_mut()
                    .for_each(|arg| *arg = arg.replace(secret, "[SECRET]"));
                if let Some(cwd) = &mut step.cwd {
                    *cwd = cwd.replace(secret, "[SECRET]");
                }
                step.env
                    .values_mut()
                    .for_each(|value| *value = value.replace(secret, "[SECRET]"));
                step.display = step.display.replace(secret, "[SECRET]");
            }
        }
    }
}

#[tauri::command]
fn prepare_run(runbook_id: String, parameters: HashMap<String, Value>) -> AppResult<PreparedRun> {
    let item = locate(&runbook_id)?;
    let (mut plan, resolved) = prepare_loaded(&item, &parameters)?;
    mask_plan_secrets(&mut plan, &item.runbook, &resolved);
    Ok(plan)
}

fn redact(mut output: String, runbook: &RunbookFile, resolved: &HashMap<String, String>) -> String {
    for parameter in &runbook.parameters {
        if parameter.kind == ParameterType::Secret {
            if let Some(secret) = resolved.get(&parameter.name) {
                if !secret.is_empty() {
                    output = output.replace(secret, "[REDACTED]");
                }
            }
        }
    }
    for pattern in &runbook.redact_patterns {
        if let Ok(regex) = Regex::new(pattern) {
            output = regex.replace_all(&output, "[REDACTED]").into_owned();
        }
    }
    if output.len() > MAX_OUTPUT_BYTES {
        output.truncate(MAX_OUTPUT_BYTES);
        output.push_str("\n[output truncated at 64 KB]");
    }
    output
}

fn history_path(demo: bool) -> AppResult<PathBuf> {
    Ok(app_data_dir()?.join(if demo {
        "demo-history.json"
    } else {
        "history.json"
    }))
}
fn history(demo: bool) -> AppResult<Vec<RunResult>> {
    read_json(&history_path(demo)?)
}
fn save_history_entry(entry: RunResult, demo: bool) -> AppResult<()> {
    let mut items = history(demo)?;
    items.insert(0, entry);
    items.truncate(MAX_HISTORY);
    write_json(&history_path(demo)?, &items)
}

#[tauri::command]
fn execute_run(
    runbook_id: String,
    parameters: HashMap<String, Value>,
    confirmation: String,
) -> AppResult<RunResult> {
    let item = locate(&runbook_id)?;
    if confirmation != item.runbook.name {
        return Err(AppError::Message(
            "The confirmation name did not match. Nothing was run.".into(),
        ));
    }
    let (plan, resolved) = prepare_loaded(&item, &parameters)?;
    let started_at = Utc::now();
    let clock = Instant::now();
    let mut combined = String::new();
    let mut status = "success".to_string();
    let mut last_code = Some(0);
    for (index, _) in item.runbook.steps.iter().enumerate() {
        let prepared = &plan.steps[index];
        combined.push_str(&format!("$ {}\n", prepared.display));
        let mut command = Command::new(&prepared.program);
        command.args(&prepared.args);
        if let Some(cwd) = &prepared.cwd {
            let canonical = fs::canonicalize(cwd).map_err(|_| {
                AppError::Message(format!("Working directory does not exist: {cwd}"))
            })?;
            if !canonical.is_dir() {
                return Err(AppError::Message(format!(
                    "Working directory is not a folder: {cwd}"
                )));
            }
            command.current_dir(canonical);
        }
        for (key, value) in &prepared.env {
            command.env(key, value);
        }
        let output = command.output().map_err(|error| {
            AppError::Message(format!("Could not start {}: {error}", prepared.program))
        })?;
        combined.push_str(&String::from_utf8_lossy(&output.stdout));
        combined.push_str(&String::from_utf8_lossy(&output.stderr));
        last_code = output.status.code();
        if !output.status.success() {
            status = "failed".into();
            break;
        }
    }
    let result = RunResult {
        id: Uuid::new_v4().to_string(),
        runbook_id,
        name: item.runbook.name.clone(),
        started_at,
        duration_ms: clock.elapsed().as_millis(),
        status,
        exit_code: last_code,
        output: redact(combined, &item.runbook, &resolved),
        rollback: item.runbook.rollback.clone(),
    };
    save_history_entry(result.clone(), is_sample_runbook(&item))?;
    Ok(result)
}

#[tauri::command]
fn get_history() -> AppResult<Vec<RunResult>> {
    history(current_state()?.demo_mode)
}

#[tauri::command]
fn clear_history() -> AppResult<()> {
    write_json(
        &history_path(current_state()?.demo_mode)?,
        &Vec::<RunResult>::new(),
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Open Hotkey Runbook", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("app icon").clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "open" => show_window(app),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_window(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_state,
            inspect_directory,
            trust_directory,
            remove_directory,
            load_sample_project,
            reset_demo_project,
            reset_sample_project,
            prepare_run,
            execute_run,
            get_history,
            clear_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running Hotkey Runbook");
}

fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> &'static str {
        r#"version: 1
id: clear-cache
name: Clear cache
description: Clears a named local cache
risk: low
tags: [cache]
rollback: Cache rebuilds on the next request.
parameters:
  - name: cache
    label: Cache name
    type: choice
    required: true
    choices: [images, pages]
steps:
  - program: printf
    args: ["cache=%s\\n", "{{cache}}"]
"#
    }

    #[test]
    fn parses_and_prepares_direct_argv() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("clear.yaml");
        fs::write(&file, sample()).unwrap();
        let files = yaml_files(directory.path()).unwrap();
        let books = load_files(directory.path(), &files).unwrap();
        let mut values = HashMap::new();
        values.insert("cache".into(), Value::String("pages; rm -rf /".into()));
        assert!(prepare_loaded(&books[0], &values).is_err());
        values.insert("cache".into(), Value::String("pages".into()));
        let (plan, _) = prepare_loaded(&books[0], &values).unwrap();
        assert_eq!(plan.steps[0].program, "printf");
        assert_eq!(plan.steps[0].args[1], "pages");
    }

    #[test]
    fn digest_changes_when_yaml_changes() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("a.yaml");
        fs::write(&file, sample()).unwrap();
        let files = yaml_files(directory.path()).unwrap();
        let first = directory_digest(directory.path(), &files).unwrap();
        fs::write(&file, sample().replace("pages]", "pages, api]")).unwrap();
        assert_ne!(first, directory_digest(directory.path(), &files).unwrap());
    }

    #[test]
    fn redacts_secret_values_and_patterns() {
        let mut runbook: RunbookFile = serde_yaml::from_str(sample()).unwrap();
        runbook.parameters[0].kind = ParameterType::Secret;
        runbook.redact_patterns = vec![r"token=\w+".into()];
        let values = HashMap::from([("cache".into(), "swordfish".into())]);
        assert_eq!(
            redact("swordfish token=abc".into(), &runbook, &values),
            "[REDACTED] [REDACTED]"
        );
    }

    #[test]
    fn rejects_a_symlinked_root_before_canonicalisation() {
        #[cfg(unix)]
        {
            use std::os::unix::fs::symlink;
            let directory = tempfile::tempdir().unwrap();
            let target = tempfile::tempdir().unwrap();
            fs::write(target.path().join("sample.yaml"), sample()).unwrap();
            let link = directory.path().join("linked-runbooks");
            symlink(target.path(), &link).unwrap();
            let error = inspect_path(&link.display().to_string())
                .unwrap_err()
                .to_string();
            assert_eq!(error, "Symlinked runbook folders are not accepted.");
        }
    }

    #[test]
    fn prepares_and_masks_environment_values_for_exact_review() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("environment.yaml");
        let yaml = sample().replace(
            "args: [\"cache=%s\\\\n\", \"{{cache}}\"]",
            "args: [\"cache=%s\\\\n\", \"{{cache}}\"]\n    env:\n      SAMPLE_TOKEN: \"{{cache}}\"",
        );
        fs::write(&file, yaml).unwrap();
        let files = yaml_files(directory.path()).unwrap();
        let mut books = load_files(directory.path(), &files).unwrap();
        books[0].runbook.parameters[0].kind = ParameterType::Secret;
        let values = HashMap::from([("cache".into(), Value::String("swordfish".into()))]);
        let (mut plan, resolved) = prepare_loaded(&books[0], &values).unwrap();
        assert_eq!(
            plan.steps[0].env.get("SAMPLE_TOKEN"),
            Some(&"swordfish".to_string())
        );
        mask_plan_secrets(&mut plan, &books[0].runbook, &resolved);
        assert_eq!(
            plan.steps[0].env.get("SAMPLE_TOKEN"),
            Some(&"[SECRET]".to_string())
        );
    }

    #[test]
    fn claim_native_safety_contract() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("safe.yaml");
        fs::write(&file, sample()).unwrap();
        assert!(assert_owned(directory.path()).is_ok());
        let files = yaml_files(directory.path()).unwrap();
        let original_digest = directory_digest(directory.path(), &files).unwrap();
        let mut books = load_files(directory.path(), &files).unwrap();

        #[cfg(unix)]
        {
            use std::os::unix::{fs::symlink, fs::PermissionsExt};

            let linked_root = directory.path().join("linked-root");
            symlink(directory.path(), &linked_root).unwrap();
            assert_eq!(
                inspect_path(&linked_root.display().to_string())
                    .unwrap_err()
                    .to_string(),
                "Symlinked runbook folders are not accepted."
            );

            let world_writable = tempfile::tempdir().unwrap();
            fs::set_permissions(world_writable.path(), fs::Permissions::from_mode(0o777)).unwrap();
            assert!(assert_owned(world_writable.path())
                .unwrap_err()
                .to_string()
                .contains("writable by other users"));
        }

        let oversized = tempfile::tempdir().unwrap();
        fs::write(
            oversized.path().join("oversized.yaml"),
            vec![b' '; MAX_FILE_BYTES as usize + 1],
        )
        .unwrap();
        assert!(yaml_files(oversized.path())
            .unwrap_err()
            .to_string()
            .contains("larger than 64 KB"));

        let crowded = tempfile::tempdir().unwrap();
        for index in 0..=100 {
            fs::write(crowded.path().join(format!("{index:03}.yaml")), sample()).unwrap();
        }
        assert_eq!(
            yaml_files(crowded.path()).unwrap_err().to_string(),
            "A trusted folder may contain at most 100 YAML files."
        );

        let mut parameterized_program = books[0].runbook.clone();
        parameterized_program.steps[0].program = "{{cache}}".into();
        assert!(validate_runbook(&parameterized_program, &file).is_err());

        let mut too_many_steps = books[0].runbook.clone();
        too_many_steps.steps = vec![too_many_steps.steps[0].clone(); 21];
        assert!(validate_runbook(&too_many_steps, &file)
            .unwrap_err()
            .to_string()
            .contains("needs 1–20 steps"));

        books[0].runbook.parameters[0].kind = ParameterType::Secret;
        books[0].runbook.steps[0]
            .env
            .insert("SAMPLE_TOKEN".into(), "{{cache}}".into());
        books[0].runbook.redact_patterns = vec![r"ticket=\w+".into()];
        let values = HashMap::from([("cache".into(), Value::String("swordfish".into()))]);
        let (mut plan, resolved) = prepare_loaded(&books[0], &values).unwrap();
        assert_eq!(plan.steps[0].program, "printf");
        assert_eq!(plan.steps[0].args[1], "swordfish");
        assert_eq!(plan.steps[0].env["SAMPLE_TOKEN"], "swordfish");
        assert_eq!(plan.rollback, "Cache rebuilds on the next request.");
        mask_plan_secrets(&mut plan, &books[0].runbook, &resolved);
        assert_eq!(plan.steps[0].args[1], "[SECRET]");
        assert_eq!(plan.steps[0].env["SAMPLE_TOKEN"], "[SECRET]");
        assert_eq!(
            redact(
                "swordfish ticket=OPS42".into(),
                &books[0].runbook,
                &resolved
            ),
            "[REDACTED] [REDACTED]"
        );

        fs::write(&file, sample().replace("pages]", "pages, api]")).unwrap();
        assert_ne!(
            original_digest,
            directory_digest(directory.path(), &files).unwrap()
        );
        assert_eq!(MAX_FILE_BYTES, 65_536);
        assert_eq!(MAX_HISTORY, 100);
    }
}
