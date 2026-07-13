import { Button } from "./button.tsx"
import { ArrowUpIcon } from "lucide-react";

export default function HeaderButton( {text}: {text:string} ){
    // count: number;

    return(
        <div>
            <p>{text}</p>
            <Button size="icon">
            </Button>
        </div>
    );
}
