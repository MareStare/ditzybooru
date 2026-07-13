import ImageCard from "./ImageCard";
import prototypeStyles from '../prototypeComponents.module.css'


export default function MostRecent(){
    return (
        <div >
            <div className={prototypeStyles.blockHeader}>
                <h1 className="text-4xl font-bold">Most Recent</h1>
                <form>
                    <textarea></textarea>
                    <textarea></textarea>
                </form>
            </div>
            <div className={prototypeStyles.imageGallery}>

            {/* Implement a map function of sorts here
                Remember to fetch data via API */}
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
            <ImageCard/>
                </div>
        </div>
    );
}
