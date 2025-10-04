// inventory.js (localStorage-backed interactive)
document.addEventListener('DOMContentLoaded', () => {
	const LS_KEY = 'inventory_static_v1'
	const tbl = document.querySelector('#productsTable tbody')
	const addBtn = document.getElementById('addBtn')
	const exportBtn = document.getElementById('exportBtn')
	const clearBtn = document.getElementById('clearBtn')
	const search = document.getElementById('search')
	const showLow = document.getElementById('showLow')

	const modal = document.getElementById('modal')
	const modalTitle = document.getElementById('modalTitle')
	const modalClose = document.getElementById('modalClose')
	const prodForm = document.getElementById('prodForm')
	const saveBtn = document.getElementById('saveBtn')
	const cancelBtn = document.getElementById('cancelBtn')

	function load(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)) || [] }catch(e){return []} }
	function save(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)) }

	let products = load()

	function id(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6) }

	function escapeHtml(s){ return String(s||'').replace(/[&<>\"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;' })[c]||c) }

	function render(){
		const q = (search && search.value||'').trim().toLowerCase()
		const onlyLow = showLow && showLow.checked
		if(!tbl) return
		tbl.innerHTML = ''

		// accumulate stats on the filtered set
		let visibleCount = 0
		let totalItems = 0
		let totalValue = 0

		products.forEach(p=>{
			if(q && !(String(p.sku||'').toLowerCase().includes(q) || String(p.name||'').toLowerCase().includes(q))) return
			if(onlyLow && !(p.stock <= p.reorder_threshold)) return

			visibleCount++
			totalItems += Number(p.stock||0)
			totalValue += Number(p.stock||0) * Number(p.price||0)

			const tr = document.createElement('tr')
			if(p.stock <= p.reorder_threshold) tr.classList.add('low')
			tr.innerHTML = `
				<td>${escapeHtml(p.sku)}</td>
				<td>${escapeHtml(p.name)}</td>
				<td>${p.stock}</td>
				<td>₱${Number(p.price).toFixed(2)}</td>
				<td>₱${Number((p.stock||0) * (p.price||0)).toFixed(2)}</td>
				<td>${p.reorder_threshold}</td>
				<td>
					<button class="btn btn-sm btn-outline-secondary btn-edit">Edit</button>
					<button class="btn btn-sm btn-outline-danger btn-delete">Delete</button>
					<button class="btn btn-sm btn-outline-success btn-adjust">Adjust</button>
				</td>
			`
			tr.querySelector('.btn-edit').onclick = ()=>openModal('edit', p)
			tr.querySelector('.btn-delete').onclick = ()=>{ if(confirm('Delete product?')){ products = products.filter(x=>x.id!==p.id); save(products); render() } }
			tr.querySelector('.btn-adjust').onclick = ()=>adjustPrompt(p)
			tbl.appendChild(tr)
		})

		// update summary cards (use elements if present)
		const elTypes = document.getElementById('statTypes')
		const elTotal = document.getElementById('statTotalItems')
		const elValue = document.getElementById('statValue')
		if(elTypes) elTypes.textContent = String(visibleCount)
		if(elTotal) elTotal.textContent = String(totalItems)
		if(elValue) elValue.textContent = '₱' + Number(totalValue).toFixed(2)
	}

	function adjustPrompt(p){
		const amount = parseInt(prompt('Adjust by (use negative to subtract)', '0')||'0',10)
		if(Number.isNaN(amount)) return alert('Invalid number')
		p.stock = Math.max(0, p.stock + amount)
		save(products); render();
	}

	function openModal(mode, p){
		if(!modal) return
		modal.style.display = 'flex'
		modal.classList.add('show')
		modalTitle.textContent = mode==='add' ? 'Add product' : 'Edit product'
		const f = prodForm
		if(mode==='edit' && p){
			f.sku.value = p.sku || ''
			f.name.value = p.name || ''
			f.description.value = p.description || ''
			f.price.value = p.price || 0
			f.stock.value = p.stock || 0
			f.reorder_threshold.value = p.reorder_threshold || 5
			f.id.value = p.id
		}else{ f.reset(); f.id.value = '' }
	}
	function closeModal(){ if(!modal) return; modal.style.display = 'none'; modal.classList.remove('show') }

	saveBtn && (saveBtn.onclick = ()=>{
		const fd = new FormData(prodForm)
		const obj = {
			id: fd.get('id') || id(),
			sku: (fd.get('sku')||'').trim(),
			name: (fd.get('name')||'').trim(),
			description: (fd.get('description')||'').trim(),
			price: parseFloat(fd.get('price')||0) || 0,
			stock: parseInt(fd.get('stock')||0,10) || 0,
			reorder_threshold: parseInt(fd.get('reorder_threshold')||5,10) || 5
		}
		if(!obj.sku || !obj.name) return alert('SKU and name required')
		const existing = products.find(x=>x.id===obj.id)
		if(existing){ Object.assign(existing, obj) }
		else{ products.push(obj) }
		save(products); render(); closeModal()
	})

	cancelBtn && (cancelBtn.onclick = closeModal)
	modalClose && (modalClose.onclick = closeModal)
	addBtn && (addBtn.onclick = ()=>openModal('add'))

	// CSV export: export the currently rendered (filtered) rows
	if(exportBtn){
		exportBtn.addEventListener('click', ()=>{
			const q = (search && search.value||'').trim().toLowerCase()
			const onlyLow = showLow && showLow.checked
			const rows = [['SKU','Name','Description','Price','Stock','ReorderThreshold','TotalValue']]
			products.forEach(p=>{
				if(q && !(String(p.sku||'').toLowerCase().includes(q) || String(p.name||'').toLowerCase().includes(q))) return
				if(onlyLow && !(p.stock <= p.reorder_threshold)) return
				rows.push([p.sku,p.name,p.description||'',Number(p.price).toFixed(2),p.stock,p.reorder_threshold,(p.stock*p.price).toFixed(2)])
			})
			const csv = rows.map(r=> r.map(cell=> '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n')
			const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a'); a.href = url; a.download = 'inventory_report.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
		})
	}

	// Clear all data
	if(clearBtn){
		clearBtn.addEventListener('click', ()=>{
			if(!confirm('Clear all data?')) return
			products.length = 0
			save(products)
			render()
		})
	}

	if(search) search.addEventListener('input', render)
	if(showLow) showLow.addEventListener('change', render)

	// seed data if empty
	if(products.length===0){
		products = [
			{id:id(), sku:'DBR-001', name:'Espresso Beans 250g', description:'Dark roast', price:250.0, stock:20, reorder_threshold:5},
			{id:id(), sku:'DBR-002', name:'Milk (1L)', description:'Fresh milk', price:80.0, stock:10, reorder_threshold:3},
			{id:id(), sku:'DBR-003', name:'Cup (12oz)', description:'Disposable cup', price:2.5, stock:200, reorder_threshold:50},
		]
		save(products)
	}

	render()

})

