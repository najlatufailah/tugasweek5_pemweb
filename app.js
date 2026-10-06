const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const matkulInput = document.getElementById('matkulInput');
const deadlineInput = document.getElementById('deadlineInput');
const errorMsg = document.getElementById('errorMsg');
const taskList = document.getElementById('taskList');
const taskCounter = document.getElementById('taskCounter');
const filterButtons = document.querySelectorAll('.filter-btn');

const STORAGE_KEY = 'todoTasksKuliah';

let tasks = ambilDariStorage();
let filterAktif = "all";

// 1. LOCAL STORAGE
function ambilDariStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function simpanKeStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 2. RENDER UTAMA (Membangun seluruh tampilan berdasarkan state & filter)
function render() {
    taskList.innerHTML = '';
    errorMsg.textContent = '';

    // Filter tasks
    let filteredTasks = tasks.filter(task => {
        if (filterAktif === 'active') return !task.selesai;
        if (filterAktif === 'completed') return task.selesai;
        return true; // 'all'
    });

    // Pesan jika daftar kosong
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

            // Struktur HTML item tugas menggunakan textContent (Aman dari XSS)
            const infoDiv = document.createElement('div');
            infoDiv.className = 'task-info';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.selesai;
            checkbox.className = 'toggle-checkbox';

            const textDiv = document.createElement('div');
            textDiv.className = 'task-text-content';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'task-title-text';
            titleSpan.textContent = task.judul; // AMAN (textContent)

            const metaSpan = document.createElement('span');
            metaSpan.className = 'task-meta';
            metaSpan.textContent = `${task.matkul} • Deadline: ${task.deadline}`; // AMAN (textContent)

            textDiv.appendChild(titleSpan);
            textDiv.appendChild(metaSpan);

            infoDiv.appendChild(checkbox);
            infoDiv.appendChild(textDiv);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn delete-action';
            deleteBtn.textContent = 'Hapus';

            li.appendChild(infoDiv);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }

    // Update Counter "N tugas aktif"
    const activeCount = tasks.filter(t => !t.selesai).length;
    taskCounter.textContent = `${activeCount} tugas aktif`;
}

// 3. TAMBAH TASK (Event Submit & Validasi)
taskForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah reload halaman

    const judul = taskInput.value.trim();
    const matkul = matkulInput.value;
    const deadline = deadlineInput.value;

    // Validasi: Judul minimal 3 karakter & deadline wajib diisi
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
        deadline: deadline,
        selesai: false
    };

    tasks.push(newTask);
    simpanKeStorage();
    render();

    // Reset form
    taskInput.value = '';
    deadlineInput.value = '';
    taskInput.focus();
});

// 4. EVENT DELEGATION (Menangani klik checkbox & tombol hapus pada <ul>)
taskList.addEventListener('click', function(e) {
    const li = e.target.closest('.task-item');
    if (!li) return;

    const id = Number(li.getAttribute('data-id'));
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Aksi Klik Checkbox Selesai
    if (e.target.classList.contains('toggle-checkbox')) {
        task.selesai = e.target.checked;
        simpanKeStorage();
        render();
    }

    // Aksi Klik Tombol Hapus
    if (e.target.classList.contains('delete-action')) {
        tasks = tasks.filter(t => t.id !== id);
        simpanKeStorage();
        render();
    }
});

// 5. FILTER BUTTONS
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        // Pindah kelas 'on' ke tombol yang diklik
        filterButtons.forEach(b => b.classList.remove('on'));
        this.classList.add('on');

        filterAktif = this.getAttribute('data-filter');
        render();
    });
});

// Render awal saat halaman dibuka
render();