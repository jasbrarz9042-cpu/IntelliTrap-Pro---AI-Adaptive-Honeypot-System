document.addEventListener('DOMContentLoaded', () => {
    
    // Utility to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    // --- Chart.js Setup ---
    const ctx = document.getElementById('attackChart').getContext('2d');
    
    // Create a gradient for the chart line
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');   
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    const attackChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['12h ago', '10h ago', '8h ago', '6h ago', '4h ago', '2h ago', 'Now'],
            datasets: [{
                label: 'Login Attempts',
                data: [0, 0, 0, 0, 0, 0, 0], // Initial empty data
                borderColor: '#6366F1',
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#8B5CF6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8B5CF6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#9CA3AF' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#9CA3AF', stepSize: 1, beginAtZero: true }
                }
            }
        }
    });

    // --- DOM Elements ---
    const totalAttacksEl = document.getElementById('total-attacks');
    const highRiskEl = document.getElementById('high-risk');
    const topUsernamesEl = document.getElementById('top-usernames');
    const threatTbody = document.getElementById('threat-tbody');
    const liveTerminal = document.getElementById('live-terminal');
    
    // Filters
    const searchInput = document.getElementById('search-log');
    const filterRisk = document.getElementById('filter-risk');
    
    let allAttacks = [];

    // --- Fetch and Render Data ---
    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            
            // Animate numbers
            totalAttacksEl.textContent = data.total_attacks;
            highRiskEl.textContent = data.high_risk;
            
            // Update Top Usernames
            topUsernamesEl.innerHTML = '';
            data.top_usernames.forEach(user => {
                const li = document.createElement('li');
                li.className = 'target-item';
                li.innerHTML = `
                    <span class="target-name">${escapeHTML(user.username)}</span>
                    <span class="target-count">${user.count} hits</span>
                `;
                topUsernamesEl.appendChild(li);
            });
            
            // Generate some fake chart data based on total (for visual effect)
            let currentTotal = data.total_attacks;
            let fakeData = [];
            for(let i=0; i<7; i++) {
                // simple curve ending in current total
                fakeData.push(Math.max(0, currentTotal - Math.floor(Math.random() * 5)));
            }
            fakeData[6] = currentTotal; // last point is exact
            
            attackChart.data.datasets[0].data = fakeData;
            attackChart.update();
            
        } catch (e) {
            console.error("Error fetching stats:", e);
        }
    }

    async function fetchAttacks() {
        try {
            const res = await fetch('/api/attacks');
            allAttacks = await res.json();
            renderTable();
            updateTerminal();
        } catch (e) {
            console.error("Error fetching attacks:", e);
        }
    }

    function renderTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const riskFilter = filterRisk.value;
        
        threatTbody.innerHTML = '';
        
        const filtered = allAttacks.filter(attack => {
            const matchesSearch = attack.ip_address.toLowerCase().includes(searchTerm) || 
                                  attack.username.toLowerCase().includes(searchTerm);
            const matchesRisk = riskFilter === 'all' || attack.risk_level === riskFilter;
            return matchesSearch && matchesRisk;
        });

        filtered.forEach(attack => {
            const tr = document.createElement('tr');
            
            let badgeClass = '';
            if (attack.risk_level === 'High Risk') badgeClass = 'badge-high';
            else if (attack.risk_level === 'Medium Risk') badgeClass = 'badge-medium';
            else badgeClass = 'badge-low';

            // Truncate user agent
            let agent = attack.user_agent || '';
            if(agent.length > 30) agent = agent.substring(0, 30) + '...';

            tr.innerHTML = `
                <td>${escapeHTML(attack.timestamp)}</td>
                <td class="cell-ip">${escapeHTML(attack.ip_address)}</td>
                <td class="cell-user">${escapeHTML(attack.username)}</td>
                <td>${'*'.repeat(Math.min((attack.password || '').length, 8))}</td>
                <td title="${escapeHTML(attack.user_agent)}">${escapeHTML(agent)}</td>
                <td><span class="badge ${badgeClass}">${escapeHTML(attack.risk_level)}</span></td>
            `;
            threatTbody.appendChild(tr);
        });
    }

    // Simulate Terminal output
    let lastSeenId = 0;
    function updateTerminal() {
        if (allAttacks.length === 0) return;
        
        const latest = allAttacks[0]; // array is ordered DESC
        if (latest.id > lastSeenId) {
            // New attack!
            let colorClass = 'text-green';
            if(latest.risk_level === 'High Risk') colorClass = 'text-red';
            else if(latest.risk_level === 'Medium Risk') colorClass = 'text-yellow';
            
            const line = document.createElement('div');
            line.className = `terminal-line ${colorClass}`;
            line.textContent = `[${latest.timestamp.split(' ')[1]}] INTRUSION: IP ${latest.ip_address} attempted login as '${latest.username}' - [${latest.risk_level.toUpperCase()}]`;
            
            liveTerminal.appendChild(line);
            liveTerminal.scrollTop = liveTerminal.scrollHeight; // Auto-scroll
            
            lastSeenId = latest.id;
        }
    }

    // Events
    searchInput.addEventListener('input', renderTable);
    filterRisk.addEventListener('change', renderTable);

    // Initial Load & Polling
    fetchStats();
    fetchAttacks();
    
    setInterval(() => {
        fetchStats();
        fetchAttacks();
    }, 5000); // Poll every 5 seconds

});
