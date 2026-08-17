import React from "react";
import { Composition } from "remotion";
import { PcExplainer } from "./PcExplainer";
import { Thumbnail } from "./Thumbnail";
import { Trastornos, TOTAL } from "./Trastornos";
import { TrastornosFull, TOTAL_FULL } from "./TrastornosFull";
import { ProofReal } from "./ProofReal";
import { TrastornosReal, TOTAL_REAL } from "./TrastornosReal";
import { ParanoideReal } from "./ParanoideReal";
import { ThumbB } from "./ThumbB";
import { TrastornosRealFull, TOTAL as TOTAL_RF } from "./TrastornosRealFull";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PcExplainer"
        component={PcExplainer}
        durationInFrames={511}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Trastornos"
        component={Trastornos}
        durationInFrames={TOTAL}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TrastornosFull"
        component={TrastornosFull}
        durationInFrames={TOTAL_FULL}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProofReal"
        component={ProofReal}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TrastornosReal"
        component={TrastornosReal}
        durationInFrames={TOTAL_REAL}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ParanoideReal"
        component={ParanoideReal}
        durationInFrames={1590}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition id="ThumbB" component={ThumbB} durationInFrames={1} fps={30} width={1280} height={720} />
      <Composition id="TrastornosRealFull" component={TrastornosRealFull} durationInFrames={TOTAL_RF} fps={30} width={1920} height={1080} />
    </>
  );
};
