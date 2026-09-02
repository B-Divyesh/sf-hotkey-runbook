cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.9"
  sha256 arm:   "db9bfef23aabca68823d3edcc68724c0359c64133ae37e2cd03e83a635b0807d",
         intel: "a1c6ccd465601783c4070e2c1e0c137014a6e7366a4da93ee6d8f5fcdefb868e"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
