import type { Task } from './types';

const tasks: Task[] = [];

/**
 * 新しいタスクをリストに追加する
 * @param title - タスクのタイトル
 */
function addTask(title: string): void {
  const newTask: Task = {
    id: tasks.length + 1, // 簡易的なID生成
    title: title,
    completed: false,
  };
  tasks.push(newTask);
}

console.log('タスク管理アプリへようこそ！');
console.log('初期状態のタスク:', tasks);

// タスクを追加してみる
addTask('TypeScriptの学習');
addTask('散歩に行く');

console.log('追加後のタスク:', tasks);