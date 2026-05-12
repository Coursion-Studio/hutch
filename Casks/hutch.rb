cask "hutch" do
  version "0.3.0"
  sha256 "a3838e9893c67bab7d34076af7a68eb5ff144111553ba11f30f905ce65e6830a"

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
