document.addEventListener('DOMContentLoaded', () => {
  function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
  }
  updateCurrentDate();
  setInterval(updateCurrentDate, 60000);

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.view).classList.add('active');
      if (btn.dataset.view === 'records') loadRecords();
    });
  });

  document.getElementById('add-item').onclick = () => {
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
      <input type="text" class="item-desc" placeholder="Description" required />
      <input type="number" class="item-amount" placeholder="Amount" min="0" step="0.01" required />
      <button type="button" class="remove-item">Remove</button>
    `;
    document.getElementById('items-container').appendChild(div);
    div.querySelector('.remove-item').onclick = () => div.remove();
  };

  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.onclick = () => btn.closest('.item-row').remove();
  });

  document.getElementById('quotation-form').onsubmit = async (e) => {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
      const desc = row.querySelector('.item-desc').value;
      const amt = parseFloat(row.querySelector('.item-amount').value);
      if (desc && !isNaN(amt)) items.push({ description: desc, amount: amt });
    });
    if (!items.length) return alert('Add at least one item.');

    const payload = {
      clientName: document.getElementById('clientName').value,
      clientAddress: document.getElementById('clientAddress').value,
      clientContact: document.getElementById('clientContact').value,
      items,
      discount: parseFloat(document.getElementById('discount').value) || 0,
      advance: parseFloat(document.getElementById('advance').value) || 0
    };

    try {
      // ✅ POINTS TO RENDER BACKEND (NOT Vercel)
      const res = await fetch('https://furnisure-quotation-app.onrender.com/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FURNiSURE-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();

        loadRecords();
        document.getElementById('quotation-form').reset();
        const container = document.getElementById('items-container');
        container.innerHTML = `
          <div class="item-row">
            <input type="text" class="item-desc" placeholder="Description" required />
            <input type="number" class="item-amount" placeholder="Amount" min="0" step="0.01" required />
            <button type="button" class="remove-item">Remove</button>
          </div>
        `;
        document.querySelectorAll('.remove-item').forEach(btn => {
          btn.onclick = () => btn.closest('.item-row').remove();
        });
        alert('✅ Quotation generated!');
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || 'Failed'));
      }
    } catch (err) {
      alert('❌ Network error — check backend URL');
    }
  };

  async function loadRecords() {
    try {
      // ✅ POINTS TO RENDER BACKEND (NOT Vercel)
      const res = await fetch('https://furnisure-quotation-app.onrender.com/api/quotations');
      const records = await res.json();
      const tbody = document.getElementById('records-body');
      const count = document.getElementById('total-count');
      count.textContent = records.length;
      tbody.innerHTML = records.map(r => `
        <tr>
          <td>${r.quotationNo}</td>
          <td>${r.clientName}</td>
          <td>${r.clientContact}</td>
          <td style="color:#28a745">₹${r.grandTotal.toLocaleString('en-IN')}</td>
          <td>${r.date}</td>
          <td>
            <svg width="18" height="18" fill="#28a745"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to load records — check backend URL');
    }
  }

  loadRecords();
});