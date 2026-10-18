import { Command, InvalidArgumentError } from "commander";
import { PLATFORMS, SKILLS } from "../core/bundled-catalog.js";

const COMMANDS = [
  "init",
  "list",
  "doctor",
  "update",
  "diff",
  "uninstall",
  "add",
  "hub",
  "remove",
  "status",
  "telemetry",
  "completion",
  "help",
];

const HUB_COMMANDS = [
  "add",
  "remove",
  "list",
  "show",
  "install",
  "update",
  "status",
  "doctor",
  "diff",
  "search",
];

export function registerCompletionCommand(program: Command): void {
  program
    .command("completion")
    .description("Generate shell completion script")
    .argument("<shell>", "Shell: bash, zsh, or fish")
    .action((shell: string) => {
      const normalized = shell.trim().toLowerCase();
      switch (normalized) {
        case "bash":
          console.log(bashCompletion());
          break;
        case "zsh":
          console.log(zshCompletion());
          break;
        case "fish":
          console.log(fishCompletion());
          break;
        default:
          throw new InvalidArgumentError(
            `Unknown shell "${shell}". Use: bash, zsh, or fish.`,
          );
      }
    });
}

export function bashCompletion(): string {
  const platforms = PLATFORMS.map((p) => p.id).join(" ");
  const skills = SKILLS.map((s) => s.id).join(" ");
  return `# agent-skills completion
_agent_skills_completions() {
  local cur prev opts
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  opts="${COMMANDS.join(" ")}"
  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "\${opts}" -- "\${cur}") )
    return 0
  fi
  case "\${COMP_WORDS[1]}" in
    init)
      case "\${prev}" in
        -p|--platform) COMPREPLY=( $(compgen -W "${platforms}" -- "\${cur}") );;
        -s|--skills) COMPREPLY=( $(compgen -W "${skills}" -- "\${cur}") );;
        --on-conflict) COMPREPLY=( $(compgen -W "replace append skip" -- "\${cur}") );;
        --append-order) COMPREPLY=( $(compgen -W "existing-first vorlaxen-first" -- "\${cur}") );;
      esac
      ;;
    completion)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- "\${cur}") );;
    telemetry)
      COMPREPLY=( $(compgen -W "status yes no" -- "\${cur}") );;
    hub)
      if [[ \${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${HUB_COMMANDS.join(" ")}" -- "\${cur}") )
      fi
      ;;
  esac
}
complete -F _agent_skills_completions agent-skills
`;
}

export function zshCompletion(): string {
  const platforms = PLATFORMS.map((p) => p.id).join(" ");
  const skills = SKILLS.map((s) => s.id).join(" ");
  return `#compdef agent-skills
_agent_skills() {
  local -a commands platforms skills conflicts orders shells
  commands=(${COMMANDS.map((c) => `'${c}'`).join(" ")})
  platforms=(${platforms.split(" ").map((p) => `'${p}'`).join(" ")})
  skills=(${skills.split(" ").map((s) => `'${s}'`).join(" ")})
  conflicts=('replace' 'append' 'skip')
  orders=('existing-first' 'vorlaxen-first')
  shells=('bash' 'zsh' 'fish')
  _arguments -C \\
    '1: :->command' \\
    '*: :->args'
  case $state in
    command) _describe 'command' commands ;;
    args)
      case $words[2] in
        init)
          _arguments \\
            '-p[Platform]:platform:($platforms)' \\
            '-s[Skills]:skills:($skills)' \\
            '--on-conflict[Conflict strategy]:mode:($conflicts)' \\
            '--append-order[Append order]:order:($orders)'
          ;;
        completion)
          _arguments '1:shell:($shells)'
          ;;
        telemetry)
          _arguments '1:action:(status yes no)'
          ;;
      esac
      ;;
  esac
}
_agent_skills "$@"
`;
}

export function fishCompletion(): string {
  const platformList = PLATFORMS.map((p) => `'${p.id}'`).join(" ");
  const skillList = SKILLS.map((s) => `'${s.id}'`).join(" ");
  return `complete -c agent-skills -f
complete -c agent-skills -n "__fish_use_subcommand" -a "${COMMANDS.join(" ")}"
complete -c agent-skills -n "__fish_seen_subcommand_from init" -s p -l platform -a "${platformList}"
complete -c agent-skills -n "__fish_seen_subcommand_from init" -s s -l skills -a "${skillList}"
complete -c agent-skills -n "__fish_seen_subcommand_from init" -l on-conflict -a "replace append skip"
complete -c agent-skills -n "__fish_seen_subcommand_from init" -l append-order -a "existing-first vorlaxen-first"
complete -c agent-skills -n "__fish_seen_subcommand_from completion" -a "bash zsh fish"
complete -c agent-skills -n "__fish_seen_subcommand_from telemetry" -a "status yes no"
`;
}
