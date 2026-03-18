export class ObjectPool {
    constructor(createFn, initialSize = 10) {
        this.createFn = createFn;
        this.pool = [];
        
        // Havuzu başlangıçta doldur
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    // Havuzdan obje al
    get() {
        // Eğer havuzda obje kaldıysa sonuncuyu ver, kalmadıysa acil durum olarak yeni üret
        return this.pool.length > 0 ? this.pool.pop() : this.createFn();
    }

    // Objeyi havuza geri bırak (RAM dostu)
    release(obj) {
        this.pool.push(obj);
    }

    // Havuzdaki boşta bekleyen obje sayısı
    getFreeCount() {
        return this.pool.length;
    }
}