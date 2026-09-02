cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.12"
  sha256 arm:   "93efb6c74962a6af9d7ccb34a46564aaac9c8961d89f602db0d79d89b1fb44e1",
         intel: "8335d47fce06a02fe4bc4b320a1df68e475ac0bfbe4fb326120ca7383cef66e8"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
