use std::{env, process::Command};

fn source_commit() -> String {
    if let Ok(commit) = env::var("HOTKEY_BUILD_COMMIT") {
        if commit.len() == 40
            && commit
                .chars()
                .all(|character| character.is_ascii_hexdigit())
        {
            return commit;
        }
    }
    if let Ok(commit) = env::var("GITHUB_SHA") {
        if commit.len() == 40
            && commit
                .chars()
                .all(|character| character.is_ascii_hexdigit())
        {
            return commit;
        }
    }
    Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|commit| commit.trim().to_string())
        .filter(|commit| {
            commit.len() == 40
                && commit
                    .chars()
                    .all(|character| character.is_ascii_hexdigit())
        })
        .unwrap_or_else(|| "unrecorded".into())
}

fn main() {
    println!("cargo:rerun-if-env-changed=HOTKEY_BUILD_COMMIT");
    println!("cargo:rerun-if-env-changed=GITHUB_SHA");
    println!("cargo:rerun-if-changed=../.git/HEAD");
    println!("cargo:rustc-env=HOTKEY_BUILD_COMMIT={}", source_commit());
    tauri_build::build()
}
