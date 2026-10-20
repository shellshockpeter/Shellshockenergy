import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({ family: "Teko", url: staticFile("fonts/teko-latin-500-normal.woff2"), weight: "500" });
loadFont({ family: "Teko", url: staticFile("fonts/teko-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Teko", url: staticFile("fonts/teko-latin-700-normal.woff2"), weight: "700" });
loadFont({
  family: "Robot Reavers",
  url: staticFile("fonts/Robot_Reavers_Italic.woff2"),
  style: "italic",
});
