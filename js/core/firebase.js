/* Firebase への接続と、読み書きのヘルパだけを持つファイル */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, collection, onSnapshot, getDoc, setDoc, updateDoc,
  runTransaction, deleteField }
  from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { COL, CATALOG_DOC } from './config.js';

export const CFG = (window.LQ_FIREBASE_CONFIG && window.LQ_FIREBASE_CONFIG.projectId)
  ? window.LQ_FIREBASE_CONFIG : null;

let fdb = null;
export const DEL = deleteField;
export { getDoc };

export async function initFirebase(){
  if(!CFG) throw new Error('firebase-config.js がありません');
  const app  = initializeApp(CFG);
  fdb  = getFirestore(app);
  const auth = getAuth(app);
  await new Promise((resolve, reject)=>{
    onAuthStateChanged(auth, u=>{ if(u) resolve(u); });
    signInAnonymously(auth).catch(reject);
  });
  return fdb;
}

export const kidRef      = id => doc(fdb, COL.kids, id);
export const catalogRef  = ()  => doc(fdb, COL.catalog, CATALOG_DOC);
export const profilesRef = ()  => collection(fdb, COL.profiles);
export const watch = (ref, cb, err)=> onSnapshot(ref, cb, err);

/* ドットつなぎのフィールドだけを書きかえます（ほかの項目は消しません） */
export async function patch(ref, fields){
  if(!fields || !Object.keys(fields).length) return true;
  try{
    await updateDoc(ref, fields);
  }catch(e){
    if(String(e.code || e.message || '').indexOf('not-found') >= 0){
      await setDoc(ref, {}, {merge:true});
      await updateDoc(ref, fields);
    }else{
      throw e;
    }
  }
  return true;
}

/* お金やもちもののように「読んでから書く」ときはこちら（取り合いになりません） */
export async function txUpdate(ref, fn){
  return runTransaction(fdb, async t=>{
    const snap = await t.get(ref);
    const cur  = snap.exists() ? (snap.data() || {}) : {};
    const out  = fn(cur);
    if(out) t.set(ref, out, {merge:true});
  });
}
