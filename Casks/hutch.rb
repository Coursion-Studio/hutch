cask "hutch" do
  version "0.2.0"
  sha256 "cc738d988252f830aa43142f60ee7bb3921d368990a7e700f4cea1827eee6623"

  url "https://github.com/Coursion-Studio/hutch/releases/download/v#{version}/Hutch-#{version}.dmg",
      verified: "github.com/Coursion-Studio/hutch/"
  name "Hutch"
  desc "Multi-tool macOS utility — window manager, file shelf, system toggles, browser picker"
  homepage "https://hutch.coursion.studio"

  livecheck do
    url "https://hutch.coursion.studio/appcast.xml"
    strategy :sparkle
  end

  auto_updates true
  depends_on macos: ">= :sequoia"

  app "Hutch.app"

  zap trash: [
    "~/Library/Application Support/Hutch",
    "~/Library/Preferences/com.coursion.hutch.plist",
    "~/Library/Caches/com.coursion.hutch",
  ]
end
