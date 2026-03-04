import FacialComponentsPanel from "../components/sketch/FacialComponentsPanel";
import CanvasArea from "../components/sketch/CanvasArea";
import VoiceInputPanel from "../components/sketch/VoiceInputPanel";
import ActionButtons from "../components/sketch/ActionButtons";
import Navbar from "../components/Navbar";

export default function SketchBuilder() {
  const handleDragStart = (e, src) => {
    e.dataTransfer.setData("text/plain", src);
  };
  <Navbar></Navbar>

  return (
    <div className="container">
      <h1 className="title">DrishtiAI – Sketch Builder</h1>

      <div className="grid">
        <FacialComponentsPanel onDragStart={handleDragStart} />
        <CanvasArea />
        <VoiceInputPanel />
      </div>

      <ActionButtons />
    </div>
  );
}