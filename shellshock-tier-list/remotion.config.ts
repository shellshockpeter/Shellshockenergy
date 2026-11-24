import { Config } from "@remotion/cli/config";

// PNG frames so the overlay keeps its transparency.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
