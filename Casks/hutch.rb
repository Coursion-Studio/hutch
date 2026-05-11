cask "hutch" do
  version "0.2.1"
  sha256 "8face07e39b333270a39e7e15b7637a9f3e45026e9afb7bde5498dfb775f9d39"

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
