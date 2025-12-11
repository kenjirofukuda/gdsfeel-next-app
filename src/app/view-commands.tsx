export default function ViewCommands () {
  return (
    <div className="flex: 0 1 auto; width: 100%">
      zoom :
      <button value="0.5" onClick="gStructureView.zoomHalf()" >
        0.5
      </button>
      <button value="2.0" onClick="gStructureView.zoomDouble()" >
        2.0
      </button>
      <button value="Fit" onClick="gStructureView.fit()" >
        Fit
      </button>
    </div>
  );
}
