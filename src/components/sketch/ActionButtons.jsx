import html2canvas from "html2canvas";
import Button from "../sketch/Button";

export default function ActionButtons() {

  const handleSave = async () => {
    const canvasElement = document.querySelector(".canvas");

    if (!canvasElement) return;

    const canvas = await html2canvas(canvasElement);

    const link = document.createElement("a");
    link.download = "sketch.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="button-row">
      <Button label="Generate Sketch" />
      <Button label="Save to Case" onClick={handleSave} />
      <Button label="Submit" />
    </div>
  );
}