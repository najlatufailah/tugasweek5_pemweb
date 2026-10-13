const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const matkulInput = document.getElementById('matkulInput');
const deadlineInput = document.getElementById('deadlineInput');
const errorMsg = document.getElementById('errorMsg');
const taskList = document.getElementById('taskList');
const taskCounter = document.getElementById('taskCounter');
const filterButtons = document.querySelectorAll('.filter-btn');

const API_URL = '/api/tugas';
let tasks = [];
let filterAktif = "all";

// Helper Cek Respon Server
async function cekRespon(response) {
    if (!response.ok) {
        let pesanError = 'Terjadi kesalahan pada server.';
        try {
            const errData = await response.json();
            pesanError = errData.message || pesanError;
        } catch (e) {
            // Jika response bukan json
        }
        throw new Error(pesanError);
    }
    return response;
}

// 1. MUAT TUGAS (GET /api/tugas dengan LocalStorage Fallback untuk pengujian lokal)
async function muatTugas() {
    taskList.innerHTML = '<li class="empty-message">Memuat tugas...</li>';
    errorMsg.textContent = '';

    try {
        const response = await fetch(API_URL);
        await cekRespon(response);
        tasks = await response.json();
    } catch (error) {
        // Fallback otomatis ke localStorage agar tidak error saat dites offline/lokal
        console.warn("API tidak aktif, beralih ke localStorage:", error.message);
        const dataLokal = localStorage.getItem('todoTasksKuliah_fallback');
        tasks = dataLokal ? JSON.parse(dataLokal) : [];
    }
    render();
}

// Fungsi bantu simpan lokal cadangan
function simpanLokalFallback() {
    localStorage.setItem('todoTasksKuliah_fallback', JSON.stringify(tasks));
}

// 2. RENDER UTAMA
function render() {
    taskList.innerHTML = '';
    errorMsg.textContent = '';

    let filteredTasks = tasks.filter(task => {
        if (filterAktif === 'active') return !task.selesai;
        if (filterAktif === 'completed') return task.selesai;
        return true;
    });

    if (filteredTasks.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-message';
        li.textContent = 'Belum ada tugas di daftar ini.';
        taskList.appendChild(li);
    } else {
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.selesai ? 'completed' : ''}`;
            li.setAttribute('data-id', task.id);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'task-info';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.selesai;
            checkbox.className = 'toggle-checkbox toggle-selesai';

            const textDiv = document.createElement('div');
            textDiv.className = 'task-text-content';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'task-title-text';
            titleSpan.textContent = task.judul;

            const metaSpan = document.createElement('span');
            metaSpan.className = 'task-meta';
            metaSpan.textContent = `${task.matkul || task.mataKuliah} • Deadline: ${task.deadline}`;

            textDiv.appendChild(titleSpan);
            textDiv.appendChild(metaSpan);

            infoDiv.appendChild(checkbox);
            infoDiv.appendChild(textDiv);

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-btn delete-action';
            deleteBtn.textContent = 'Hapus';

            li.appendChild(infoDiv);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }

    const activeCount = tasks.filter(t => !t.selesai).length;
    taskCounter.textContent = `${activeCount} tugas aktif`;
}

// 3. TAMBAH TASK (POST /api/tugas)
taskForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const judul = taskInput.value.trim();
    const matkul = matkulInput.value;
    const deadline = deadlineInput.value;

    if (judul.length < 3) {
        errorMsg.textContent = 'Judul tugas minimal harus 3 karakter!';
        return;
    }
    if (!deadline) {
        errorMsg.textContent = 'Deadline wajib diisi!';
        return;
    }

    errorMsg.textContent = '';
    const newTask = {
        id: Date.now(),
        judul: judul,
        matkul: matkul,
        mataKuliah: matkul,
        deadline: deadline,
        selesai: false
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        await cekRespon(response);
        await muatTugas();
    } catch (error) {
        // Fallback jika API gagal: simpan secara lokal agar aplikasi tetap berfungsi di browser kamu
        tasks.push(newTask);
        simpanLokalFallback();
        render();
    }

    taskInput.value = '';
    deadlineInput.value = '';
    taskInput.focus();
});

// 4. EVENT DELEGATION (PATCH & DELETE)
taskList.addEventListener('click', async function(e) {
    const li = e.target.closest('.task-item');
    if (!li) return;

    const id = li.getAttribute('data-id');
    const task = tasks.get ? null : tasks.find(t => String(t.id) === String(id));
    if (!task) return;

    if (e.target.classList.contains('toggle-selesai')) {
        const statusBaru = e.target.checked;
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selesai: statusBaru })
            });
            await cekRespon(response);
            await muatTugas();
        } catch (error) {
            task.selesai = statusBaru;
            simpanLokalFallback();
            render();
        }
    }

    if (e.target.classList.contains('delete-action')) {
        if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            await cekRespon(response);
            await muatTugas();
        } catch (error) {
            tasks = tasks.filter(t => String(t.id) !== String(id));
            simpanLokalFallback();
            render();
        }
    }
});

// 5. FILTER BUTTONS
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        filterButtons.forEach(b => b.classList.remove('on'));
        this.classList.add('on');

        filterAktif = this.getAttribute('data-filter');
        render();
    });
});

// Inisialisasi awal
muatTugas();