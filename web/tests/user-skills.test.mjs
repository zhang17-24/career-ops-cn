import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { uploadSkill, updateSkill, catalog, listSkills, readSkillFile } from '../src/lib/user-skills.mjs';
test('complete packages, incomplete metadata, version switching, recovery and path guards', async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'skill-center-test-'));
 try {
  const zip=new JSZip();zip.file('demo/code/run.py','print(1)');zip.file('demo/guide.md','Guide');zip.file('demo/assets/a.bin',Buffer.from([0,1,2]));
  const id=await uploadSkill(root,[{name:'demo.zip',data:await zip.generateAsync({type:'nodebuffer'})}]);
  assert.equal(catalog(root).length,0);assert.equal(listSkills(root)[0].ready,false);
  assert.throws(()=>updateSkill(root,{id,action:'enable'}));
  updateSkill(root,{id,action:'metadata',name:'Demo',description:'Test',entry:'guide.md'});
  updateSkill(root,{id,action:'enable'});assert.equal(catalog(root)[0].version,1);
  assert.deepEqual(readSkillFile(root,id,'assets/a.bin'),Buffer.from([0,1,2]));
  const next=await uploadSkill(root,[{name:'SKILL.md',data:Buffer.from('---\nname: Demo\ndescription: Test\n---\nBody')}],id);
  assert.equal(catalog(root)[0].version,1);updateSkill(root,{id:next,action:'enable'});assert.equal(catalog(root)[0].version,2);
  updateSkill(root,{id:next,action:'delete'});assert.equal(catalog(root).length,0);updateSkill(root,{id:next,action:'restore'});assert.equal(catalog(root).length,0);
  updateSkill(root,{id,action:'enable'});assert.equal(catalog(root)[0].version,1);
  await assert.rejects(uploadSkill(root,[{name:'../escape.py',data:Buffer.from('x')}]));
  assert.throws(()=>readSkillFile(root,id,'../../registry.json'));
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
