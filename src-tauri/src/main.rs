fn main() {
    if std::env::args()
        .skip(1)
        .any(|argument| argument == "--build-identity")
    {
        println!("{}", hotkey_runbook_lib::build_identity_json());
        return;
    }
    hotkey_runbook_lib::run();
}
