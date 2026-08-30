cask "hotkey-runbook" do
  arch arm: "arm64", intel: "x86_64"

  version "0.1.3"
  sha256 arm:   "39fd3b131f035d0c4715540a0a5e0886a0f7803809a9979ee9f9ab2ceb722543",
         intel: "3e107387a88ba7894c87c849f4cd56bd9d80eeb4df24dfbe9bdea3ce802cab0c"

  url "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v#{version}/Hotkey-Runbook_#{version}_macos-#{arch}.dmg"
  name "Hotkey Runbook"
  desc "Keyboard-first local launcher for reviewed YAML runbooks"
  homepage "https://hotkey-runbook.sociobot.in"

  app "Hotkey Runbook.app"
end
