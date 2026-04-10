export class SeededRandom{
	private seed: number;
	constructor(seedValue: number){
		this.seed=seedValue;
	}
	public nextInt(min: number, max: number): number{
		return Math.floor(this.nextFloat()*(max-min+1))+min;
	}
	public nextFloat(): number{
		let t=this.seed+=0x6D2B79F5;
		t=Math.imul(t^t>>>15, t|1);
		t^=t+Math.imul(t^t>>>17, t|1);
		return ((t>>>0)/4294967296);
	}
	public choice<T>(arr: T[]): T{
		return arr[this.nextInt(0,arr.length-1)];
	}
}