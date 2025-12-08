import InfoBar from './info-bar';
import ViewCommands from './view-commands';
import ExampleList from './example-list';

export default function HomePage(props) {
  return (
    <div id="container" className="box max-h-full">
      <div id="row1" className="header row">
      </div>
      <div id="row2" className="content row flex">
        <div id="struc-list" className="border border-gray400 flex vscroll">
          {/*  https://zenn.dev/ampersand/articles/759a7ff03f085a */ }
          {/* @ts-expect-error Server Component */}
          <ExampleList />
        </div>
        <div id="element-list" className="visible border border-gray400 flex vscroll">
        </div>
        <div id="box-right" className="flex">
          <InfoBar />

          <div id="canvas-wrapper" className="bg-sky-50">
            <canvas id="canvas"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
