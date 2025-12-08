'use server';

import fs from 'node:fs';
import path from 'node:path';
import { Inform } from '@/src/gds/server/stream';

export default async function ExampleList() {
  const inform = new Inform();
  inform.gdsPath = path.join(process.cwd(), 'seedgds', 'test.gds');
  // console.log(inform);
  await inform.run();
  const contents = inform.library.structureNames();
  return (
    contents.map((each: string) => <a key={each}>{ each }</a> )
  );
}
