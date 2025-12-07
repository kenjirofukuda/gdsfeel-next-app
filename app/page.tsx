import InfoBar from './info-bar';
import ViewCommands from './view-commands';

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
          <InfoBar />
          <ViewCommands />
          <div id="canvas-wrapper" className="bg-sky-50">
            <canvas id="canvas"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
