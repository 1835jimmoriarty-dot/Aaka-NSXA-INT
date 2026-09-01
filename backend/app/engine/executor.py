import asyncio
from datetime import datetime
from typing import List, Callable, Optional, Dict, Any
from app.core.logging import logger

class SubprocessExecutor:
    def __init__(self, timeout: int = 1800):
        self.timeout = timeout
        self.process: Optional[asyncio.subprocess.Process] = None
        self._is_cancelled = False

    async def execute(
        self,
        command_args: List[str],
        on_stdout_line: Optional[Callable[[str], None]] = None,
        on_stderr_line: Optional[Callable[[str], None]] = None
    ) -> Dict[str, Any]:
        self._is_cancelled = False
        start_time = datetime.utcnow()
        stdout_chunks: List[str] = []
        stderr_chunks: List[str] = []

        logger.info(f"Executing: {' '.join(command_args)}")

        try:
            self.process = await asyncio.create_subprocess_exec(
                *command_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            async def read_stream(stream, callback, chunks):
                while True:
                    line = await stream.readline()
                    if not line:
                        break
                    decoded = line.decode("utf-8", errors="replace").rstrip("\r\n")
                    chunks.append(decoded)
                    if callback:
                        try:
                            callback(decoded)
                        except Exception as e:
                            logger.error(f"Stream callback error: {e}")

            await asyncio.wait_for(
                asyncio.gather(
                    read_stream(self.process.stdout, on_stdout_line, stdout_chunks),
                    read_stream(self.process.stderr, on_stderr_line, stderr_chunks),
                    self.process.wait()
                ),
                timeout=self.timeout
            )

            return_code = self.process.returncode
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            return {
                "success": return_code == 0,
                "return_code": return_code,
                "stdout": "\n".join(stdout_chunks),
                "stderr": "\n".join(stderr_chunks),
                "duration_seconds": duration,
                "cancelled": self._is_cancelled
            }

        except asyncio.TimeoutError:
            logger.warning(f"Process timed out after {self.timeout}s: {' '.join(command_args)}")
            await self.cancel()
            return {
                "success": False,
                "return_code": -1,
                "stdout": "\n".join(stdout_chunks),
                "stderr": f"Execution timed out after {self.timeout} seconds.",
                "duration_seconds": self.timeout,
                "cancelled": False,
                "error": "Timeout"
            }
        except Exception as e:
            logger.error(f"Execution error: {str(e)}")
            return {
                "success": False,
                "return_code": -1,
                "stdout": "\n".join(stdout_chunks),
                "stderr": str(e),
                "duration_seconds": (datetime.utcnow() - start_time).total_seconds(),
                "cancelled": self._is_cancelled,
                "error": str(e)
            }

    async def cancel(self):
        self._is_cancelled = True
        if self.process and self.process.returncode is None:
            try:
                self.process.terminate()
                await asyncio.sleep(0.5)
                if self.process.returncode is None:
                    self.process.kill()
            except Exception as e:
                logger.error(f"Error killing process: {e}")
