# ==============================================================================
# CONTOH REVIEW KODE: PERULANGAN (LOOP)
# File ini mendemonstrasikan beberapa bug dan masalah
# performa yang sering ditemukan pada loop saat Code Review,
# beserta cara memperbaikinya.
# ==============================================================================

import time
from collections import deque

print("="*60)
print("DEMO CODE REVIEW PERULANGAN (LOOP) PYTHON")
print("="*60)

# ------------------------------------------------------------------------------
# KASUS 1: Off-by-One Error & Modifikasi List Saat Iterasi
# ------------------------------------------------------------------------------
print("\n--- Kasus 1: Modifikasi List saat Iterasi ---")

def hapus_nilai_negatif_salah(data):
    # DANGEROUS: Mengubah ukuran list di tengah-tengah loop range(len())
    # Menyebabkan IndexError atau melewati elemen!
    list_copy = data.copy()
    try:
        for i in range(len(list_copy)):
            if list_copy[i] < 0:
                list_copy.pop(i)
    except IndexError as e:
        print(f"  [ERROR Terdeteksi]: {e} (akibat panjang list berubah saat di-iterasi)")
    return list_copy

def hapus_nilai_negatif_benar(data):
    # DENGAN BENAR: List comprehension membuat list baru secara bersih & cepat
    return [angka for angka in data if angka >= 0]

data_uji = [10, -5, -2, 8, -1, 4]
print("Data awal      :", data_uji)
hapus_nilai_negatif_salah(data_uji)
print("Hasil perbaikan:", hapus_nilai_negatif_benar(data_uji))


# ------------------------------------------------------------------------------
# KASUS 2: Masalah Performa - Kompleksitas O(N^2) vs O(N) (Nested Lookup)
# ------------------------------------------------------------------------------
print("\n--- Kasus 2: Performa O(N^2) vs O(N) ---")

list_a = list(range(10000))
list_b = list(range(5000, 15000))

# Cara Lambat: O(N * M)
t0 = time.time()
irisan_lambat = [x for x in list_a if x in list_b]
t1 = time.time()
waktu_lambat = (t1 - t0) * 1000

# Cara Cepat: O(N + M) dengan Set Lookup O(1)
t0 = time.time()
set_b = set(list_b)
irisan_cepat = [x for x in list_a if x in set_b]
t1 = time.time()
waktu_cepat = (t1 - t0) * 1000

print(f"Jumlah irisan ditemukan: {len(irisan_cepat)}")
print(f"Waktu 'if x in list' (Lambat) : {waktu_lambat:.2f} ms")
print(f"Waktu 'if x in set'  (Cepat)  : {waktu_cepat:.2f} ms")
print(f"Peningkatan Kecepatan         : {waktu_lambat / max(waktu_cepat, 0.001):.1f}x lebih cepat!")


# ------------------------------------------------------------------------------
# KASUS 3: Masalah Infinite Loop saat Memproses Queue
# ------------------------------------------------------------------------------
print("\n--- Kasus 3: Infinite Loop Safety ---")

def proses_antrean_aman(antrean_list):
    antrean = deque(antrean_list)
    hasil = []
    
    while antrean:
        item = antrean.popleft() # SELALU keluarkan elemen dari antrean terlebih dahulu!
        if item == "skip":
            print("  [Info] Menjumpai 'skip', melewati tugas...")
            continue
        hasil.append(item)
        print(f"  [Sukses] Memproses item: {item}")
    
    return hasil

antrean = ["Tugas 1", "skip", "Tugas 2", "Tugas 3"]
print("Memproses antrean aman:")
proses_antrean_aman(antrean)

print("\n" + "="*60)
print("PEMERIKSAAN KODE REVIEW SELESAI SANTAI & AMAN")
print("="*60)
