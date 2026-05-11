cask "hutch" do
  version "0.2.3"
  sha256 "b8f64eebfc7d8198f90755c4c0bda87d4660d0b47624bda68440fe677040e3c9"

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
