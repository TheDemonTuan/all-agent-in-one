import type { CommandBlockData } from '../types/terminal';

// Shell prompt patterns for different shells
const PROMPT_PATTERNS = [
  // Bash/Zsh: user@host:path$ or user@host:path#
  /^[\w\-]+@[\w\-]+:[\w\/~\-.]+[#$]\s*/,
  // PowerShell: PS path> or PS C:\path>
  /^PS\s+[\w\\:~\/.-]+>\s*/,
  // CMD: C:\path> or C:\path\
  /^[A-Z]:\\[^>]*>\s*/,
  // Generic: path$ or path#
  /[\w\/~\-.]+[#$]\s*$/,
];

// Common command separators
const COMMAND_SEPARATORS = [';', '&&', '||', '|'];

interface ParsedCommand {
  command: string;
  timestamp: number;
}

/**
 * Parse terminal output to extract commands from shell prompts
 */
export function parseTerminalData(data: string, lastPrompt: string = ''): { commands: ParsedCommand[]; newPrompt: string } {
  const commands: ParsedCommand[] = [];
  let currentPrompt = lastPrompt;

  // Split by newlines to process line by line
  const lines = data.split('\n');

  for (const line of lines) {
    // Check if this line contains a prompt
    const isPrompt = PROMPT_PATTERNS.some(pattern => pattern.test(line));

    if (isPrompt) {
      // Extract command after the prompt
      let command = '';

      // Try to extract command from different prompt formats
      const bashMatch = line.match(/^[\w\-]+@[\w\-]+:[\w\/~\-.]+[#$]\s*(.+)$/);
      if (bashMatch) {
        command = bashMatch[1].trim();
      }

      const psMatch = line.match(/^PS\s+[\w\\:~\/.-]+>\s*(.+)$/);
      if (psMatch) {
        command = psMatch[1].trim();
      }

      const cmdMatch = line.match(/^[A-Z]:\\[^>]*>\s*(.+)$/);
      if (cmdMatch) {
        command = cmdMatch[1].trim();
      }

      // If we found a command, add it
      if (command && command.length > 0 && !isPromptOnly(command)) {
        commands.push({
          command,
          timestamp: Date.now(),
        });
      }

      currentPrompt = line;
    }
  }

  return { commands, newPrompt: currentPrompt };
}

/**
 * Check if a line is just a prompt without a command
 */
function isPromptOnly(text: string): boolean {
  const promptPatterns = [
    /^[\w\-]+@[\w\-]+:[\w\/~\-.]+[#$]\s*$/,
    /^PS\s+[\w\\:~\/.-]+>\s*$/,
    /^[A-Z]:\\[^>]*>\s*$/,
  ];

  return promptPatterns.some(pattern => pattern.test(text));
}

/**
 * Extract command blocks from terminal buffer
 * This analyzes the terminal content and creates command blocks
 */
export function extractCommandBlocks(
  terminalId: string,
  buffer: string,
  existingBlocks: CommandBlockData[] = []
): CommandBlockData[] {
  const blocks: CommandBlockData[] = [...existingBlocks];
  const lines = buffer.split('\n');

  let currentCommand: string | null = null;
  let currentOutput: string[] = [];
  let lastPrompt: string = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isPrompt = PROMPT_PATTERNS.some(pattern => pattern.test(line));

    if (isPrompt) {
      // If we have a pending command, save it as a block
      if (currentCommand) {
        const block: CommandBlockData = {
          id: generateBlockId(),
          terminalId,
          command: currentCommand,
          output: currentOutput.join('\n'),
          status: 'success', // Assume success unless we detect error
          timestamp: Date.now(),
        };
        blocks.push(block);
      }

      // Extract new command from this prompt
      currentCommand = extractCommandFromPrompt(line);
      currentOutput = [];
      lastPrompt = line;
    } else if (currentCommand) {
      // This is output from the current command
      currentOutput.push(line);

      // Check for error indicators in output
      if (isErrorIndicator(line)) {
        // Update last block status if it exists
        if (blocks.length > 0) {
          blocks[blocks.length - 1].status = 'error';
        }
      }
    }
  }

  // Don't save the last incomplete command - wait for next prompt
  return blocks;
}

/**
 * Extract command from a prompt line
 */
function extractCommandFromPrompt(line: string): string | null {
  // Bash/Zsh
  const bashMatch = line.match(/^[\w\-]+@[\w\-]+:[\w\/~\-.]+[#$]\s*(.+)$/);
  if (bashMatch) return bashMatch[1].trim();

  // PowerShell
  const psMatch = line.match(/^PS\s+[\w\\:~\/.-]+>\s*(.+)$/);
  if (psMatch) return psMatch[1].trim();

  // CMD
  const cmdMatch = line.match(/^[A-Z]:\\[^>]*>\s*(.+)$/);
  if (cmdMatch) return cmdMatch[1].trim();

  return null;
}

/**
 * Check if a line indicates an error
 */
function isErrorIndicator(line: string): boolean {
  const errorPatterns = [
    /error[:\s]/i,
    /failure[:\s]/i,
    /failed[:\s]/i,
    /exception[:\s]/i,
    /traceback/i,
    /cannot find/i,
    /not found/i,
    /permission denied/i,
    /access denied/i,
    /command not found/i,
  ];

  return errorPatterns.some(pattern => pattern.test(line));
}

/**
 * Generate a unique block ID
 */
function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse a single line for command completion
 * Used when processing terminal output in real-time
 */
export function parseCommandLine(line: string): { isCommand: boolean; command?: string } {
  const promptMatch = PROMPT_PATTERNS.find(pattern => pattern.test(line));

  if (!promptMatch) {
    return { isCommand: false };
  }

  const command = extractCommandFromPrompt(line);

  if (command && command.length > 0 && !isPromptOnly(line)) {
    return { isCommand: true, command };
  }

  return { isCommand: false };
}
