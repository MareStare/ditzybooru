import prototypeStyles from '../prototypeComponents.module.css';
import { Button } from './ui/button';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, EyeOffIcon } from 'lucide-react';

export default function CardHeader() {
  return (
    <div className={prototypeStyles.cardHeader}>
      <p>0</p>
      <Button>
        <StarIcon />
      </Button>
      <Button>
        <ArrowUpIcon />
      </Button>
      <p>0</p>
      <Button>
        <ArrowDownIcon />
      </Button>
      <Button>
        <EyeOffIcon />
      </Button>
    </div>
  );
}
