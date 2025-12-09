import InfoBar from './info-bar';
//import ViewCommands from './view-commands';
import StructureList from './structure-list';
import ElementList from './element-list';
import { Inform } from '@/src/gds/server/stream';
import { Library, StationProps } from '@/src/gds/container';
import path from 'node:path';
import { GdsProvider } from '@/context/gds-context';

async function getLibrary(): Promise<Library> {
  const inform = new Inform();
  inform.gdsPath = path.join(process.cwd(), 'seedgds', 'test.gds');
  await inform.run();
  return inform.library;
}

export default async function Page() {
  const library = await getLibrary();
  const strLibrary = library.stringify();
  //  console.log(strLibrary);
  const objLibrary = JSON.parse(strLibrary);
  console.log(objLibrary);
  const station: StationProps = {
    library: objLibrary,
    structureName: ""
  };

  return (
    <div id="container" className="box max-h-full">
      <div id="row1" className="header row">
      </div>
      <div id="row2" className="content row flex">
        <GdsProvider initialData={{structureName: '', libraryObject: objLibrary} }>
          <div id="struc-list" className="border border-gray400 flex vscroll">
            {/*  https://zenn.dev/ampersand/articles/759a7ff03f085a */ }
            { /* @ts-expect-error Server Component */ }
            <StructureList station={ station } />
          </div>
          <div id="element-list" className="visible border border-gray400 flex vscroll">
            <ElementList station={ station } />
          </div>
        </GdsProvider>
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
