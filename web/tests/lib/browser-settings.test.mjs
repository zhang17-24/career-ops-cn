import {test} from "node:test";
import assert from "node:assert/strict";
import {CONFIG_KEY,readSettings,persistSettings} from "../../src/lib/browser-settings.mjs";

test("settings persist patches, notify readers, and preserve data on failure", () => {
  const old = {localStorage:globalThis.localStorage,window:globalThis.window,StorageEvent:globalThis.StorageEvent};
  let raw = JSON.stringify({cliId:"claude",logos:false,custom:"keep",apiKey:"legacy"});
  const events=[];
  try {
    globalThis.localStorage={getItem:()=>raw,setItem:(key,value)=>{assert.equal(key,CONFIG_KEY);raw=value;}};
    globalThis.window={dispatchEvent:e=>events.push(e)};
    globalThis.StorageEvent=class {constructor(type,init){this.type=type;Object.assign(this,init);}};
    persistSettings({cliId:"codex",mode:"cli",apiKey:"never-store"});
    assert.equal(readSettings().cliId,"codex");
    assert.equal(readSettings().logos,false);
    assert.equal(readSettings().custom,"keep");
    assert.equal(readSettings().apiKey,undefined);
    persistSettings({logos:true});
    assert.equal(readSettings().cliId,"codex");
    assert.equal(events.length,2);
    assert.equal(events[0].key,CONFIG_KEY);
    assert.equal(JSON.parse(events[0].newValue).cliId,"codex");
    raw="{broken";
    assert.throws(()=>persistSettings({cliId:"claude"}));
    assert.equal(raw,"{broken");
    assert.equal(events.length,2);
    raw='{"cliId":"codex"}';
    globalThis.localStorage.setItem=()=>{throw new Error("quota")};
    assert.throws(()=>persistSettings({cliId:"claude"}),/quota/);
    assert.equal(readSettings().cliId,"codex");
    assert.equal(events.length,2);
  } finally {
    for(const [key,value] of Object.entries(old)) {
      if(value===undefined) delete globalThis[key]; else globalThis[key]=value;
    }
  }
});
