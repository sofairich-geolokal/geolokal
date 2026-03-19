import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col">
        <div className="col-span-2">
          <a href="/viewerDashboard/viewerlogin"> <h1>Geolokal Viewers</h1></a>
        </div>
        <div className="col-span-2">
         <a href="/lgu-login"> <h1>Ibaan LGU</h1></a>
        </div>
        <div className="col-span-2">
          <h1>Super Admin</h1>
        </div>
      </div>
    </div>
  );
}
