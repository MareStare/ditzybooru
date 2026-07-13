import CardHeader from "./CardHeader";
import prototypeStyles from '../prototypeComponents.module.css'


export default function ImageCard(){
    return(
        <div className={prototypeStyles.imageCard}>
            <CardHeader/>
            <img src="https://derpicdn.net/img/2026/6/25/3843118/medium.png"/>
        </div>
    );
}