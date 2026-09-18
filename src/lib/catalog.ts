import coral from "@/assets/product-coral.jpg";
import marina from "@/assets/product-marina.jpg";
import brisa from "@/assets/product-brisa.jpg";
import concha from "@/assets/product-concha.jpg";

export type Product = { id:string; slug:string; name:string; category:string; price:number; image:string; color:string; sizes:string[]; description:string };
export const products: Product[] = [
 {id:"1",slug:"biquini-coral",name:"Biquíni Coral",category:"Biquínis",price:289,image:coral,color:"Cacau",sizes:["P","M","G"],description:"Cortininha de toque macio com amarrações delicadas e caimento ajustável."},
 {id:"2",slug:"maio-marina",name:"Maiô Marina",category:"Maiôs",price:349,image:marina,color:"Turquesa",sizes:["P","M","G","GG"],description:"Decote transpassado e modelagem que abraça o corpo com conforto."},
 {id:"3",slug:"saida-brisa",name:"Saída Brisa",category:"Saídas",price:319,image:brisa,color:"Espuma",sizes:["P/M","G/GG"],description:"Leveza em linho misto para acompanhar os dias de sol à beira-mar."},
 {id:"4",slug:"bolsa-concha",name:"Bolsa Concha",category:"Acessórios",price:259,image:concha,color:"Natural",sizes:["Único"],description:"Palha tramada e alças em tom caramelo para guardar os essenciais do verão."},
 {id:"5",slug:"biquini-duna",name:"Biquíni Duna",category:"Biquínis",price:279,image:coral,color:"Marrom",sizes:["P","M","G"],description:"Uma silhueta clássica, desenhada para dias inteiros de sol."},
 {id:"6",slug:"maio-onda",name:"Maiô Onda",category:"Maiôs",price:369,image:marina,color:"Água",sizes:["P","M","G"],description:"Linhas suaves inspiradas no movimento do mar."},
 {id:"7",slug:"kimono-areia",name:"Kimono Areia",category:"Saídas",price:299,image:brisa,color:"Creme",sizes:["P/M","G/GG"],description:"Textura natural e movimento fluido em uma peça essencial."},
 {id:"8",slug:"bolsa-mare",name:"Bolsa Maré",category:"Acessórios",price:239,image:concha,color:"Palha",sizes:["Único"],description:"Feita para caminhar entre a cidade e a praia."},
];
export const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
