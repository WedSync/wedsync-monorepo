#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_COMPLETION_FILE = 'specs/001-wedsync-wedme-comprehensive/task-completion.md';
const TASKS_FILE = 'specs/001-wedsync-wedme-comprehensive/tasks.md';

/**
 * Parse task completion markdown to extract current state
 */
function parseTaskCompletion(content) {
  const lines = content.split('\n');
  const tasks = [];
  let currentSection = '';
  let completedCount = 0;
  let totalCount = 0;
  
  for (const line of lines) {
    // Extract current completion count
    const countMatch = line.match(/\*\*Completed\*\*: (\d+)\/(\d+) tasks \((\d+)% complete\)/);
    if (countMatch) {
      completedCount = parseInt(countMatch[1]);
      totalCount = parseInt(countMatch[2]);
    }
    
    // Extract task lines
    const taskMatch = line.match(/- \[(x| )\] \*\*([^*]+)\*\* (.+)/);
    if (taskMatch) {
      tasks.push({
        id: taskMatch[2],
        description: taskMatch[3],
        completed: taskMatch[1] === 'x',
        line: line
      });
    }
  }
  
  return { tasks, completedCount, totalCount, content };
}

/**
 * Parse tasks.md to get task descriptions
 */
function parseTasksFile(content) {
  const lines = content.split('\n');
  const tasks = {};
  
  for (const line of lines) {
    const taskMatch = line.match(/- \[ \] ([^)]+)/);
    if (taskMatch) {
      const fullDescription = taskMatch[1];
      const idMatch = fullDescription.match(/^([^)]+)/);
      if (idMatch) {
        const id = idMatch[1].trim();
        tasks[id] = fullDescription;
      }
    }
  }
  
  return tasks;
}

/**
 * Mark a task as completed
 */
function completeTask(taskId, description = null, completionNotes = null) {
  try {
    // Read current task completion file
    const completionContent = fs.readFileSync(TASK_COMPLETION_FILE, 'utf8');
    const parsed = parseTaskCompletion(completionContent);
    
    // Find the task to update
    const taskIndex = parsed.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      console.error(`Task ${taskId} not found in task completion file`);
      return false;
    }
    
    const task = parsed.tasks[taskIndex];
    if (task.completed) {
      console.log(`Task ${taskId} is already completed`);
      return true;
    }
    
    // Update task status
    let updatedContent = parsed.content;
    const oldLine = task.line;
    const newLine = oldLine.replace('- [ ]', '- [x]');
    updatedContent = updatedContent.replace(oldLine, newLine);
    
    // Update completion count
    const newCompletedCount = parsed.completedCount + 1;
    const newPercentage = Math.round((newCompletedCount / parsed.totalCount) * 100);
    
    const oldCountLine = `**Completed**: ${parsed.completedCount}/${parsed.totalCount} tasks (${Math.round((parsed.completedCount / parsed.totalCount) * 100)}% complete)`;
    const newCountLine = `**Completed**: ${newCompletedCount}/${parsed.totalCount} tasks (${newPercentage}% complete)`;
    updatedContent = updatedContent.replace(oldCountLine, newCountLine);
    
    // Update latest completion
    const oldLatestMatch = updatedContent.match(/\*\*Latest Completion\*\*: ([^-]+) - COMPLETE ✅/);
    if (oldLatestMatch) {
      const newLatestLine = `**Latest Completion**: ${taskId} ${task.description.split(' ').slice(0, 4).join(' ')} - COMPLETE ✅`;
      updatedContent = updatedContent.replace(oldLatestMatch[0], newLatestLine);
    }
    
    // Add completion details section
    if (completionNotes) {
      const recentCompletionsMatch = updatedContent.match(/(### Recent Completions \([^)]+\):)/);
      if (recentCompletionsMatch) {
        const completionDetails = `
**${taskId} - ${description || task.description}**: ✅ COMPLETE
${completionNotes}

### Previous Completions (${oldLatestMatch ? oldLatestMatch[1].trim() : 'Previous'}):`;
        
        updatedContent = updatedContent.replace(
          recentCompletionsMatch[0],
          `### Recent Completions (${taskId}):\n${completionDetails}`
        );
      }
    }
    
    // Write updated content
    fs.writeFileSync(TASK_COMPLETION_FILE, updatedContent);
    
    console.log(`✅ Task ${taskId} marked as completed`);
    console.log(`📊 Progress: ${newCompletedCount}/${parsed.totalCount} tasks (${newPercentage}% complete)`);
    
    return true;
  } catch (error) {
    console.error('Error updating task completion:', error);
    return false;
  }
}

/**
 * List all incomplete tasks
 */
function listIncompleteTasks() {
  try {
    const completionContent = fs.readFileSync(TASK_COMPLETION_FILE, 'utf8');
    const parsed = parseTaskCompletion(completionContent);
    
    const incompleteTasks = parsed.tasks.filter(task => !task.completed);
    
    console.log(`\n📋 Incomplete Tasks (${incompleteTasks.length} remaining):`);
    console.log('=' .repeat(50));
    
    incompleteTasks.forEach(task => {
      console.log(`${task.id}: ${task.description}`);
    });
    
    return incompleteTasks;
  } catch (error) {
    console.error('Error listing tasks:', error);
    return [];
  }
}

/**
 * Get next task to work on
 */
function getNextTask() {
  const incompleteTasks = listIncompleteTasks();
  if (incompleteTasks.length > 0) {
    console.log(`\n🎯 Next task to work on: ${incompleteTasks[0].id}`);
    console.log(`Description: ${incompleteTasks[0].description}`);
    return incompleteTasks[0];
  } else {
    console.log('\n🎉 All tasks completed!');
    return null;
  }
}

/**
 * Show current progress
 */
function showProgress() {
  try {
    const completionContent = fs.readFileSync(TASK_COMPLETION_FILE, 'utf8');
    const parsed = parseTaskCompletion(completionContent);
    
    const completedTasks = parsed.tasks.filter(task => task.completed);
    const percentage = Math.round((completedTasks.length / parsed.tasks.length) * 100);
    
    console.log(`\n📊 Current Progress:`);
    console.log(`Completed: ${completedTasks.length}/${parsed.tasks.length} tasks (${percentage}%)`);
    console.log(`Remaining: ${parsed.tasks.length - completedTasks.length} tasks`);
    
    // Show progress bar
    const barLength = 40;
    const filledLength = Math.round((completedTasks.length / parsed.tasks.length) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`Progress: [${bar}] ${percentage}%`);
    
    return {
      completed: completedTasks.length,
      total: parsed.tasks.length,
      percentage
    };
  } catch (error) {
    console.error('Error showing progress:', error);
    return null;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'complete':
      const taskId = args[1];
      const description = args[2];
      const notes = args.slice(3).join(' ');
      
      if (!taskId) {
        console.error('Usage: node update-task-completion.js complete <TASK_ID> [description] [notes...]');
        process.exit(1);
      }
      
      completeTask(taskId, description, notes);
      break;
      
    case 'list':
      listIncompleteTasks();
      break;
      
    case 'next':
      getNextTask();
      break;
      
    case 'progress':
      showProgress();
      break;
      
    default:
      console.log(`
Task Completion Automation Script

Usage:
  node scripts/update-task-completion.js <command> [options]

Commands:
  complete <TASK_ID> [description] [notes...]  Mark a task as completed
  list                                        List all incomplete tasks
  next                                        Show next task to work on
  progress                                    Show current progress

Examples:
  node scripts/update-task-completion.js complete T071 "Journey builder page" "- Created comprehensive journey management interface\\n- Implemented search and filtering\\n- Added analytics and status management"
  node scripts/update-task-completion.js list
  node scripts/update-task-completion.js progress
      `);
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  completeTask,
  listIncompleteTasks,
  getNextTask,
  showProgress,
  parseTaskCompletion
};