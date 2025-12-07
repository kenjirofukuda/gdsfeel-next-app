
function Header({ title }) {
  return <h1>{title ? title : 'Default title'}</h1>;
}

export default function HomePage() {
  return (
    <div id="container" className="box max-h-full">
      <div id="row1" className="header row">
      </div>
      <div id="row2" className="content row flex">
        <div id="struc-list" className="border border-gray400 flex vscroll">
          struct list
        </div>
        <div id="element-list" className="visible border border-gray400 flex vscroll">
          elment list
        </div>
        <div id="box-right" className="flex">
          <div id="info-bar">
          </div>
          <div id="view-buttons" className="flex: 0 1 auto; width: 100%">
          </div>
          <div id="canvas-wrapper" className="bg-sky-50">
            <canvas id="canvas"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
