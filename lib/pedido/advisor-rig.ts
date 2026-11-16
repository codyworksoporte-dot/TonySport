import {Bone, Box3, Float32BufferAttribute, Group, Matrix4, Mesh, Object3D, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3} from 'three';

const smooth = (min:number, max:number, value:number) => {
  const t=Math.max(0,Math.min(1,(value-min)/(max-min)));
  return t*t*(3-2*t);
};

/** A lightweight body rig for this A-pose asset. It has no facial/lip-sync rig.
 * Weights are created once; Three's GPU skinning handles the animated joints.
 * The returned character faces +Z, is 1.7 units tall, with its feet at Y=0.
 */
export function createAdvisorRig(source:Object3D) {
  source.updateMatrixWorld(true);
  const parts:Mesh[]=[];
  source.traverse(object=>{if(object instanceof Mesh)parts.push(object);});
  const turn=new Matrix4().makeRotationY(-Math.PI/2);
  const geometries=parts.map(mesh=>mesh.geometry.clone().applyMatrix4(mesh.matrixWorld).applyMatrix4(turn));
  const box=new Box3();
  for(const geometry of geometries){geometry.computeBoundingBox();box.union(geometry.boundingBox!);}
  const height=1.7, scale=height/Math.max(.001,box.max.y-box.min.y), center=box.getCenter(new Vector3());
  const root=new Group();root.name='TonyAdvisorBodyRig';
  const bones:Bone[]=[];
  const joint=(name:string,x:number,y:number,z:number,parent?:Bone)=>{
    const bone=new Bone();bone.name=name;bone.position.set(x*height,y*height,z*height);
    if(parent){const origin=parent.getWorldPosition(new Vector3());bone.position.sub(origin);parent.add(bone);}else root.add(bone);
    root.updateMatrixWorld(true);bones.push(bone);return bone;
  };
  joint('TonyRoot',0,0,0);
  const spine=joint('TonySpine',0,.61,0,bones[0]);
  const head=joint('TonyHead',0,.84,0,spine);
  const leftShoulder=joint('TonyLeftShoulder',-.112,.79,0,spine);
  const leftElbow=joint('TonyLeftElbow',-.215,.64,0,leftShoulder);
  const rightShoulder=joint('TonyRightShoulder',.112,.79,0,spine);
  const rightElbow=joint('TonyRightElbow',.215,.64,0,rightShoulder);
  const skeleton=new Skeleton(bones);
  for(let part=0;part<parts.length;part++){
    const geometry=geometries[part];
    geometry.translate(-center.x,-box.min.y,-center.z).scale(scale,scale,scale);
    const positions=geometry.getAttribute('position'),indices:number[]=[],weights:number[]=[];
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i)/height,y=positions.getY(i)/height,ax=Math.abs(x);
      const upper=smooth(.52,.68,y),headWeight=smooth(.81,.88,y);
      const arm=smooth(.105,.165,ax)*(1-smooth(.81,.85,y))*smooth(.40,.44,y);
      const elbow=smooth(.18,.235,ax), shoulderIndex=x<0?3:5, elbowIndex=x<0?4:6;
      if(arm>0){
        indices.push(0,1,shoulderIndex,elbowIndex);
        weights.push((1-arm)*(1-upper),(1-arm)*upper,arm*(1-elbow),arm*elbow);
      }else{
        indices.push(0,1,2,0);
        weights.push((1-headWeight)*(1-upper),(1-headWeight)*upper,headWeight,0);
      }
    }
    geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4));
    geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));
    const mesh=new SkinnedMesh(geometry,parts[part].material);mesh.name='TonyAdvisor';mesh.frustumCulled=false;
    root.add(mesh);root.updateMatrixWorld(true);mesh.bind(skeleton);
    parts[part].geometry.dispose();
  }
  let activity=0;
  return {
    root,
    update(seconds:number,speaking:boolean,reducedMotion=false){
      activity+=(Number(speaking)-activity)*.09;
      const t=reducedMotion?0:seconds, a=reducedMotion?0:activity;
      // Rest the arms below their A-pose, then gently open each hand while talking.
      leftShoulder.rotation.z=.40-a*(.10+.09*Math.sin(t*1.65));
      rightShoulder.rotation.z=-.40+a*(.10+.09*Math.sin(t*1.65+1.8));
      leftShoulder.rotation.x=-a*(.05+.055*Math.sin(t*1.35));
      rightShoulder.rotation.x=-a*(.05+.055*Math.sin(t*1.35+1.7));
      leftElbow.rotation.x=-a*(.19+.13*Math.sin(t*1.8));
      rightElbow.rotation.x=-a*(.19+.13*Math.sin(t*1.8+2));
      head.rotation.y=reducedMotion?0:Math.sin(t*.7)*.025+a*Math.sin(t*1.45)*.025;
      head.rotation.x=a*Math.sin(t*2)*.016;
      spine.rotation.z=reducedMotion?0:Math.sin(t*.65)*.006;
    },
    dispose(){skeleton.dispose();},
  };
}
