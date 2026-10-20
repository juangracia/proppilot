# Picks a JDK the backend can build with. Spring Boot 3.2's Lombok breaks on JDK 25+,
# so a global JAVA_HOME pointing at a newer JDK is ignored. Order: PROPPILOT_JAVA_HOME,
# sdkman 17 (matches .sdkmanrc and Railway), sdkman 21, Homebrew openjdk@21.
use_project_jdk() {
  local candidate
  local candidates=(
    "${PROPPILOT_JAVA_HOME:-}"
    "$HOME/.sdkman/candidates/java/17.0.15-tem"
    "$(ls -d "$HOME"/.sdkman/candidates/java/17.* 2>/dev/null | head -1)"
    "$(ls -d "$HOME"/.sdkman/candidates/java/21.* 2>/dev/null | head -1)"
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  )
  for candidate in "${candidates[@]}"; do
    if [[ -n "$candidate" && -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done
  echo "No JDK 17 or 21 found. Install one (sdk install java 17.0.15-tem) or set PROPPILOT_JAVA_HOME." >&2
  return 1
}
