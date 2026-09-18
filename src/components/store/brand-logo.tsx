import logo from "@/assets/agua-limpa-logo-cropped.jpg.asset.json";
import monogram from "@/assets/agua-limpa-monograma.png.asset.json";
export function BrandLogo({compact=false}:{compact?:boolean}){return <img src={compact?monogram.url:logo.url} alt="Água Limpa Beachwear" className={compact?"h-10 w-10 object-contain":"h-12 w-auto object-contain md:h-14"}/>}
