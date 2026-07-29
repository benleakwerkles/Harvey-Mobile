import { StyleSheet, Text, View } from "react-native";

import type { BuildIdentity } from "../data/buildIdentity";
import type { BuildQueuePriority, BuildQueueView } from "../data/buildQueue";
import type { ProjectCockpitView } from "../data/projectCockpit";
import type { ProjectSnapshotView } from "../data/projectSnapshot";
import { BuildQueueCard } from "./BuildQueueCard";
import { ProjectCockpitCard } from "./ProjectCockpitCard";

type CommandBoardProps = Readonly<{ buildIdentity: BuildIdentity; cockpit: ProjectCockpitView; snapshot: ProjectSnapshotView; queue: BuildQueueView; variant: "home" | "build"; onAddTask: (title:string,priority:BuildQueuePriority)=>void; onReprioritizeTask:(id:string,priority:BuildQueuePriority)=>void; onAdvanceTask:(id:string)=>void }>;

export function CommandBoard({ buildIdentity,cockpit,snapshot,queue,variant,onAddTask,onReprioritizeTask,onAdvanceTask }:CommandBoardProps){
  const progress=queue.totalCount===0?0:Math.round((queue.doneCount/queue.totalCount)*100);
  return <>
    <View style={styles.provenance}><View style={styles.rowBetween}><Text style={styles.eyebrow}>COMMITTED SANDBOX SNAPSHOT</Text><Text style={styles.truth}>SNAPSHOT · NOT LIVE</Text></View><Text style={styles.sourceLabel}>SOURCE</Text><Text selectable style={styles.sourceValue}>{snapshot.sourcePath}</Text><Text style={styles.sourceLabel}>COMMIT</Text><Text selectable style={styles.sha}>{snapshot.sourceSha}</Text><Text style={styles.sourceLabel}>OBSERVED</Text><Text style={styles.sourceValue}>{snapshot.observedAt}</Text><Text style={styles.freshness}>{snapshot.ageDays} DAYS OLD · {snapshot.freshness}</Text><Text style={styles.boundary}>Queue changes stay in this app session. Reload resets them. No live Werkles connection is claimed.</Text></View>
    <View style={styles.buildIdentity}><View style={styles.rowBetween}><Text style={styles.eyebrow}>CLOUD BUNDLE IDENTITY</Text><Text style={[styles.buildTruth,buildIdentity.state==="CI_BOUND"&&styles.boundTruth]}>{buildIdentity.state==="CI_BOUND"?"BOUND":"UNBOUND"}</Text></View><Text style={styles.sourceLabel}>{buildIdentity.truthLabel}</Text><Text selectable style={styles.sha}>{buildIdentity.sha??"No CI SHA in this local session"}</Text><Text style={styles.boundary}>This identifies the exact exported tree only. No deployment is claimed.</Text></View>
    <ProjectCockpitCard view={cockpit}/>
    <View style={styles.hero}><View style={styles.rowBetween}><Text style={styles.label}>ACTIVE PROJECT</Text><Text style={styles.badge}>NON HEARTHLAND</Text></View><Text style={styles.project}>{snapshot.project}</Text><View style={styles.track}><View style={[styles.fill,{width:`${progress}%`}]}/></View><View style={styles.rowBetween}><Text style={styles.small}>{queue.doneCount} of {queue.totalCount} moves done locally</Text><Text style={styles.percent}>{progress}%</Text></View></View>
    <BuildQueueCard onAdd={onAddTask} onAdvance={onAdvanceTask} onReprioritize={onReprioritizeTask} queue={queue} variant={variant}/>
  </>;
}
const styles=StyleSheet.create({
 provenance:{backgroundColor:"#0D1A2A",borderRadius:20,borderWidth:1,borderColor:"#20344C",padding:16,marginTop:20},buildIdentity:{backgroundColor:"#0D1A2A",borderRadius:20,borderWidth:1,borderColor:"#20344C",padding:16,marginTop:12},rowBetween:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:12},eyebrow:{color:"#52D3FF",fontSize:10,fontWeight:"900",letterSpacing:1.4},truth:{color:"#FFB45D",fontSize:9,fontWeight:"900"},buildTruth:{color:"#FFB45D",fontSize:9,fontWeight:"900"},boundTruth:{color:"#57E39B"},sourceLabel:{color:"#8EA0B7",fontSize:9,fontWeight:"800",marginTop:13},sourceValue:{color:"#F4F7FB",fontSize:12,marginTop:3},sha:{color:"#52D3FF",fontSize:11,marginTop:3},freshness:{color:"#57E39B",fontSize:10,fontWeight:"800",marginTop:14},boundary:{color:"#8EA0B7",fontSize:11,lineHeight:17,marginTop:8},hero:{backgroundColor:"#0D1A2A",borderRadius:24,borderWidth:1,borderColor:"#20344C",padding:20,marginTop:12},label:{color:"#8EA0B7",fontSize:11,fontWeight:"800"},badge:{color:"#FFB45D",fontSize:9,fontWeight:"900"},project:{color:"#F4F7FB",fontSize:28,fontWeight:"800",marginTop:22},track:{height:7,borderRadius:5,backgroundColor:"#05101A",marginTop:22,marginBottom:10,overflow:"hidden"},fill:{height:"100%",borderRadius:5,backgroundColor:"#57E39B"},small:{color:"#8EA0B7",fontSize:12},percent:{color:"#57E39B",fontSize:12,fontWeight:"800"}
});
