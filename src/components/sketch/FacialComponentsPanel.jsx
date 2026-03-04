export default function FacialComponentsPanel({ onDragStart }) {
  const components = [
    "/assets/face_structure/face1.jpeg",
    "/assets/face_structure/face2.jpeg",
    "/assets/face_structure/face3.jpeg",
    "/assets/face_structure/face4.jpeg",
    "/assets/face_structure/face5.jpeg",
    "/assets/face_structure/face6.jpeg",
    "/assets/face_structure/face7.png",
    "/assets/face_structure/face8.jpeg",
    "/assets/face_structure/face9.jpeg",
    "/assets/face_structure/face10.jpeg",
    "/assets/Eye/eyes1.jpeg",
    "/assets/Eye/eyes2.jpeg",
    "/assets/Eye/eyes3.jpeg",
    "/assets/Eye/eyes4.jpeg",
    "/assets/Eye/eyes5.jpeg",
    "/assets/Eye/eyes6.jpeg", 
    "/assets/Eye/eyes7.jpeg",
    "/assets/Eye/eyes8.jpeg",
    "/assets/Eye/eyes9.jpeg",
    "/assets/Eye/eyes10.jpeg",
    "/assets/hair/hair1.jpeg",
    "/assets/hair/hair2.jpeg",
    "/assets/hair/hair3.jpeg",
    "/assets/hair/hair4.jpeg",
    "/assets/hair/hair5.jpeg",
    "/assets/hair/hair6.jpeg",
    "/assets/hair/hair7.jpeg",
    "/assets/hair/hair8.jpeg",
    "/assets/hair/hair9.jpeg",
    "/assets/hair/hair10.jpeg",
    "/assets/lips/lip1.png",
    "/assets/lips/lip2.png",
    "/assets/lips/lip3.png",
    "/assets/lips/lip4.png",
    "/assets/lips/lip5.png",
    "/assets/lips/lip6.png",
    "/assets/lips/lip7.png",
    "/assets/lips/lip8.png",
    "/assets/lips/lip9.png",
    "/assets/lips/lip10.png",
    "/assets/lips/lip11.png",
    "/assets/lips/lip12.png",
    "/assets/nose/nose1.jpeg",
    "/assets/nose/nose2.jpeg",
    "/assets/nose/nose3.jpeg",
    "/assets/nose/nose4.jpeg",  
    "/assets/nose/nose5.jpeg",
    "/assets/nose/nose6.jpeg",
    "/assets/nose/nose7.jpeg",
    "/assets/nose/nose8.jpeg",
    "/assets/nose/nose9.jpeg",
    "/assets/nose/nose10.jpeg",
    "/assets/nose/nose11.jpeg",
    
  ];

  return (
    <div
      className="panel"
      style={{
        height: "600px",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: "5px",
      }}
    >
      <h3>Facial Components</h3>

      {components.map((src, index) => (
        <img
          key={index}
          src={src}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("external", src)
          }
          style={{
            width: "80px",
            margin: "10px",
            cursor: "grab",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}