
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Goal, Expense, GoalStatus, COLUMNS, DEFAULT_CATEGORIES } from './types';
import { GoalCard } from './components/GoalCard';
import { ExpenseChart } from './components/ExpenseChart';
import { 
  Plus, 
  Layout, 
  TrendingDown, 
  Wallet, 
  X,
  Save,
  Trash2,
  Repeat,
  Pencil,
  CalendarRange
} from 'lucide-react';

// Helper ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // --- State ---
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('amigo_bolso_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('amigo_bolso_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('amigo_bolso_custom_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'kanban' | 'expenses'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'goal' | 'expense'>('goal');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  // Default to current month YYYY-MM
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Form States
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Expense Form Specifics
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [expenseDate, setExpenseDate] = useState('');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isRecurringInput, setIsRecurringInput] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('amigo_bolso_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('amigo_bolso_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('amigo_bolso_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  // --- Computed Data ---
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // 1. Get available months for the dropdown
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    // Always add current month
    monthSet.add(new Date().toISOString().slice(0, 7));
    
    expenses.forEach(e => {
      if (e.date) {
        monthSet.add(e.date.slice(0, 7));
      }
    });
    // Sort descending (newest first)
    return Array.from(monthSet).sort().reverse();
  }, [expenses]);

  // 2. Filter expenses based on selected month
  const filteredExpenses = useMemo(() => {
    if (monthFilter === 'all') return expenses;
    return expenses.filter(e => e.date && e.date.startsWith(monthFilter));
  }, [expenses, monthFilter]);

  // 3. Calculate totals based on filtered data
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // 4. Calculate category totals dynamically based on filtered expenses
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      summary[e.category] = (summary[e.category] || 0) + e.amount;
    });
    
    // Convert to array and sort by value descending
    return Object.entries(summary)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Helper to format YYYY-MM to readable string
  const formatMonthLabel = (yyyy_mm: string) => {
    if (yyyy_mm === 'all') return 'Todo o Histórico';
    const [year, month] = yyyy_mm.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // --- Handlers ---

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newGoals = [...goals];
    const goalIndex = newGoals.findIndex(g => g.id === draggableId);
    
    if (goalIndex === -1) return;

    const goal = newGoals[goalIndex];

    // Update status based on column
    const newStatus = destination.droppableId as GoalStatus;
    
    const updatedGoal = { ...goal, status: newStatus };
    newGoals[goalIndex] = updatedGoal;

    setGoals(newGoals);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = {
      id: generateId(),
      title,
      amount: parseFloat(amount),
      saved: 0,
      deadline,
      status: GoalStatus.TODO,
    };
    setGoals([...goals, newGoal]);
    closeModal();
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalCategory = category;

    // Handle Custom Category Creation
    if (isNewCategoryMode) {
      const trimmedName = newCategoryName.trim();
      if (!trimmedName) return; // Validation
      
      // If it's truly new, add it to list
      if (!allCategories.includes(trimmedName)) {
        setCustomCategories([...customCategories, trimmedName]);
      }
      finalCategory = trimmedName;
    }

    const currentAmount = parseFloat(amount);
    const creationDate = expenseDate || new Date().toISOString().split('T')[0];

    if (editingId) {
      // UPDATE EXISTING
      setExpenses(expenses.map(exp => {
        if (exp.id === editingId) {
          return {
            ...exp,
            title,
            amount: currentAmount,
            category: finalCategory,
            date: creationDate,
            isRecurring: isRecurringInput,
          };
        }
        return exp;
      }));
    } else {
      // CREATE NEW
      const baseId = generateId();
      const newExpense: Expense = {
        id: baseId,
        title,
        amount: currentAmount,
        category: finalCategory,
        isRecurring: isRecurringInput,
        date: creationDate,
      };

      const expensesToAdd = [newExpense];

      // Logic for Recurring Expenses: Automatically add for next month (Only on Create)
      if (isRecurringInput) {
        const dateObj = new Date(creationDate);
        // Add 1 month
        dateObj.setMonth(dateObj.getMonth() + 1);
        
        const nextMonthDate = dateObj.toISOString().split('T')[0];
        
        const nextMonthExpense: Expense = {
          id: generateId(),
          title: `${title}`,
          amount: currentAmount,
          category: finalCategory,
          isRecurring: true,
          date: nextMonthDate,
        };
        
        expensesToAdd.push(nextMonthExpense);
      }
      setExpenses([...expenses, ...expensesToAdd]);
    }

    closeModal();
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleEditExpense = (expense: Expense) => {
    setModalType('expense');
    setEditingId(expense.id);
    
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setExpenseDate(expense.date || '');
    setIsRecurringInput(expense.isRecurring);
    
    if (allCategories.includes(expense.category)) {
      setCategory(expense.category);
      setIsNewCategoryMode(false);
      setNewCategoryName('');
    } else {
      setIsNewCategoryMode(true);
      setNewCategoryName(expense.category);
      setCategory('NEW');
    }
    
    setIsModalOpen(true);
  };

  const openModal = (type: 'goal' | 'expense') => {
    setModalType(type);
    setEditingId(null);
    setTitle('');
    setAmount('');
    setDeadline('');
    
    // Reset Expense Form
    setCategory(DEFAULT_CATEGORIES[0]);
    setExpenseDate(new Date().toISOString().split('T')[0]); // Default to today
    setIsNewCategoryMode(false);
    setNewCategoryName('');
    setIsRecurringInput(false);
    
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-emerald-100" />
            <h1 className="text-2xl font-bold tracking-tight">Amigo do Bolso</h1>
          </div>
          <nav className="flex space-x-1 bg-emerald-700/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'kanban' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:bg-emerald-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layout size={16} /> Objetivos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'expenses' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:bg-emerald-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingDown size={16} /> Gastos
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        
        {/* TAB: KANBAN */}
        {activeTab === 'kanban' && (
          <div className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Quadro de Metas</h2>
              <button
                onClick={() => openModal('goal')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
              >
                <Plus size={20} /> Nova Meta
              </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COLUMNS.map((column) => (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200 min-h-[500px] flex flex-col"
                      >
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                          {column.title}
                          <span className="bg-slate-200 text-slate-600 text-xs py-1 px-2 rounded-full">
                            {goals.filter(g => g.status === column.id).length}
                          </span>
                        </h3>
                        <div className="flex-1">
                          {goals
                            .filter((goal) => goal.status === column.id)
                            .map((goal, index) => (
                              <GoalCard 
                                key={goal.id} 
                                goal={goal} 
                                index={index} 
                                onDelete={handleDeleteGoal}
                              />
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {/* TAB: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-slate-800">Planejamento Mensal</h2>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Month Filter */}
                <div className="relative flex-1 md:flex-none">
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500">
                    <CalendarRange size={16} className="text-slate-500 mr-2" />
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none cursor-pointer w-full"
                    >
                      {availableMonths.map(month => (
                        <option key={month} value={month}>{formatMonthLabel(month)}</option>
                      ))}
                      <option value="all">Todo o Histórico</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => openModal('expense')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-all hover:shadow-md active:scale-95 whitespace-nowrap"
                >
                  <Plus size={20} /> <span className="hidden sm:inline">Adicionar Gasto</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
                <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">
                  {monthFilter === 'all' ? 'Total Acumulado' : `Total em ${formatMonthLabel(monthFilter)}`}
                </h3>
                <div className="text-4xl font-bold text-slate-800 mb-1">
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-slate-500">
                   {filteredExpenses.length} {filteredExpenses.length === 1 ? 'lançamento' : 'lançamentos'}.
                </p>
                
                <div className="mt-8">
                   <h4 className="font-semibold text-slate-700 mb-3">Categorias ({monthFilter === 'all' ? 'Geral' : 'Mês'})</h4>
                   <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                     {categorySummary.length === 0 ? (
                       <p className="text-sm text-slate-400 italic">Sem gastos no período selecionado.</p>
                     ) : (
                       categorySummary.map(item => {
                         const percent = totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0;
                         return (
                           <div key={item.name} className="flex flex-col space-y-1">
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-700 font-medium">{item.name}</span>
                               <span className="text-slate-500 text-xs">{percent}%</span>
                             </div>
                             <div className="flex items-center gap-3">
                               <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500" style={{ width: `${percent}%` }}></div>
                               </div>
                               <span className="text-sm font-semibold text-slate-800 min-w-[70px] text-right">
                                 R$ {item.value.toLocaleString('pt-BR')}
                               </span>
                             </div>
                           </div>
                         )
                       })
                     )}
                   </div>
                </div>
              </div>

              {/* Chart & List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Chart now receives pre-filtered expenses */}
                <ExpenseChart expenses={filteredExpenses} />
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Descrição</th>
                          <th className="px-6 py-4">Categoria</th>
                          <th className="px-6 py-4 text-right">Valor</th>
                          <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                              Nenhum gasto encontrado para este período.
                            </td>
                          </tr>
                        ) : (
                          filteredExpenses.map((expense) => (
                            <tr 
                              key={expense.id} 
                              className="hover:bg-slate-50 transition-colors cursor-pointer group"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <td className="px-6 py-4 text-slate-500">
                                {expense.date ? new Date(expense.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-800">{expense.title}</td>
                              <td className="px-6 py-4 text-slate-600">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                  {expense.category}
                                </span>
                                {expense.isRecurring && (
                                   <span className="ml-2 inline-flex items-center text-emerald-500" title="Recorrente">
                                     <Repeat size={12} />
                                   </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-slate-800">
                                R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleEditExpense(expense)}
                                    className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                    title="Editar"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Excluir"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800">
                {modalType === 'goal' ? 'Nova Meta' : (editingId ? 'Editar Gasto' : 'Novo Gasto')}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={modalType === 'goal' ? handleAddGoal : handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={modalType === 'goal' ? "Ex: Viagem de Férias" : "Ex: Aluguel"}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {modalType === 'goal' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
                  <input
                    required
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              {modalType === 'expense' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input
                      required
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <div className="space-y-2">
                      <select
                        value={isNewCategoryMode ? "NEW" : category}
                        onChange={(e) => {
                          if (e.target.value === "NEW") {
                            setIsNewCategoryMode(true);
                            setCategory("");
                          } else {
                            setIsNewCategoryMode(false);
                            setCategory(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="NEW" className="font-bold text-emerald-600">✨ Nova Categoria...</option>
                      </select>

                      {isNewCategoryMode && (
                        <input
                          autoFocus
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Digite o nome da categoria"
                          className="w-full px-4 py-2 rounded-lg border-2 border-emerald-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          required
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <div className="flex items-center h-5">
                       <input
                         id="isRecurring"
                         type="checkbox"
                         checked={isRecurringInput}
                         onChange={(e) => setIsRecurringInput(e.target.checked)}
                         className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                       />
                     </div>
                     <div className="flex flex-col">
                       <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700 cursor-pointer">
                         Gasto Recorrente
                       </label>
                       <span className="text-xs text-slate-500">
                         {editingId 
                           ? "Atualizar status de recorrência deste gasto." 
                           : "Se marcado, será criado automaticamente um registro idêntico para o próximo mês."}
                       </span>
                     </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95 flex justify-center items-center gap-2 mt-6"
              >
                <Save size={20} /> {editingId ? 'Salvar Alterações' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
