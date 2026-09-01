cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.8"
  sha256 arm:   "684a24a64ad13345e4e55a2f9cd5a8ee8b1d53c858b2178eecb623f179f59934",
         intel: "28b9b8ed20c8c4fce994a9b848a9bc35108a7c2c43d1f2dd0e8e954f2be5be18"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
