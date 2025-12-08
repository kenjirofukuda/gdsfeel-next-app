'use server';

import fs from 'node:fs';
import path from 'node:path';
import { Inform } from '@/src/gds/server/stream';

export default async function ExampleList() {
  const inform = new Inform();
  const contents = inform.exampleList();
  inform.gdsPath = path.join(process.cwd(), 'seedgds', 'test.gds');
  console.log(inform);
  await inform.run();
  return (
    <ul>
      { contents.map((each) => <li key={each}>{ each }</li> ) }
    </ul>
  );
}
