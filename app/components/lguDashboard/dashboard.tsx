import Cards from "../cards";
import DataChart from "../datachart";
import Projectschart from "../projectschart";
export default function Dashboard(){
    return(
        <div className="bg-white px-2">
        <Cards />
                <div className="flex flex-col lg:flex-row gap-6 px-5">
                    <div className="flex-1 rounded-2x1">
                        <Projectschart />
                    </div>
                    <div className="flex-1 rounded-2xl">
                        <DataChart />
                    </div>
                </div>
        
        </div>
    )
};
