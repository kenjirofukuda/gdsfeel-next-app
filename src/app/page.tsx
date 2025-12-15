import InfoBar from './info-bar';
import ViewCommands from './view-commands';
import StructureList from './structure-list';
import ElementList from './element-list';
import GdsCanvas from './gds-canvas';
import { Library } from 'gdsfeel-js';
import { Inform } from 'gdsfeel-js/server';
import path from 'node:path';
import { GdsProvider } from '@/context/gds-context';

async function getLibrary(): Promise<Library | undefined> {
  const inform = new Inform();
  inform.gdsPath = path.join(process.cwd(), 'seedgds', 'test.gds');
  await inform.run();
  return inform.library;
}

export default async function Page() {
  const library = await getLibrary();
  return (
    <div id="container" className="box max-h-full">
      <GdsProvider initialData={{
        structureName: '',
        library: undefined,
        libraryObject: library?.asObject() && {}
      }}>
        <div id="row1" className="header row">
        </div>
        <div id="row2" className="content row flex">
          <div id="struc-list" className="border border-gray400 flex vscroll">
            <StructureList />
          </div>
          <div id="element-list" className="visible border border-gray400 flex vscroll">
            <ElementList />
          </div>
          <div id="box-right" className="flex">
            <InfoBar />
            <ViewCommands />
            <GdsCanvas />
          </div>
        </div>
      </GdsProvider>
    </div>
  );
}
